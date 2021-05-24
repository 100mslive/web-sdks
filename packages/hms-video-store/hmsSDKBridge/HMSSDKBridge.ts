import {
  createDefaultStoreState,
  HMSMediaSettings,
  HMSMessage,
  HMSMessageType,
  HMSPeer,
  HMSPeerID,
  HMSTrack,
  HMSTrackID,
} from '../schema';
import { IHMSBridge } from '../IHMSBridge';
import * as sdkTypes from './sdkTypes';
import { SDKToHMS } from './adapter';
import {
  selectIsLocalAudioEnabled,
  selectIsLocalScreenShared,
  selectIsLocalVideoEnabled,
  selectLocalAudioTrackID,
  selectLocalVideoTrackID,
  selectHMSMessagesCount,
  selectPeerNameByID,
  selectPeersMap,
  selectTracksMap, selectIsConnectedToRoom,
} from '../selectors';
import HMSLogger from '../../utils/ui-logger';
import { HMSSdk } from '@100mslive/100ms-web-sdk';
import { IHMSStore } from '../IHMSStore';
import SDKHMSException from '@100mslive/100ms-web-sdk/dist/error/HMSException';
import SDKHMSVideoTrack from '@100mslive/100ms-web-sdk/dist/media/tracks/HMSVideoTrack';
import SDKHMSTrack from '@100mslive/100ms-web-sdk/dist/media/tracks/HMSTrack';
import HMSLocalAudioTrack from '@100mslive/100ms-web-sdk/dist/media/tracks/HMSLocalAudioTrack';
import HMSLocalVideoTrack from '@100mslive/100ms-web-sdk/dist/media/tracks/HMSLocalVideoTrack';

export class HMSSDKBridge implements IHMSBridge {
  private hmsSDKTracks: Record<string, SDKHMSTrack> = {};
  private readonly sdk: HMSSdk;
  private readonly store: IHMSStore;
  private isRoomJoinCalled: boolean = false;

  constructor(sdk: HMSSdk, store: IHMSStore) {
    this.sdk = sdk;
    this.store = store;
  }

  join(config: sdkTypes.HMSConfig) {
    if (this.isRoomJoinCalled) {
      this.logPossibleInconsistency('room join is called again');
      return; // ignore
    }
    try {
      this.sdkJoinWithListeners(config);
      this.isRoomJoinCalled = true;
    } catch (err) {
      this.isRoomJoinCalled = false; // so it can be called again if needed
      HMSLogger.e("Failed to connect to room - ", err);
      return;
    }
  }

  async leave() {
    const isRoomConnected = selectIsConnectedToRoom(this.store.getState());
    if (!isRoomConnected) {
      this.logPossibleInconsistency('room leave is called when no room is connected');
      return; // ignore
    }
    return this.sdk.leave().then(() => {
      this.resetState();
      HMSLogger.i('sdk', 'left room');
    }).catch((err) => {
      HMSLogger.e("error in leaving room - ", err);
    })
  }

  async setScreenShareEnabled(enabled:boolean){
    if(enabled){
      await this.startScreenShare();
    } else{
      await this.stopScreenShare();
    }
  }

  async setLocalAudioEnabled(enabled: boolean) {
    const trackID = selectLocalAudioTrackID(this.store.getState());
    if (trackID) {
      const isCurrentEnabled = selectIsLocalAudioEnabled(this.store.getState());
      if (isCurrentEnabled === enabled) {
        // why would same value will be set again?
        this.logPossibleInconsistency('local audio track muted states.');
      }
      await this.setEnabledTrack(trackID, enabled);
    }
  }

  async setLocalVideoEnabled(enabled: boolean) {
    const trackID = selectLocalVideoTrackID(this.store.getState());
    if (trackID) {
      const isCurrentEnabled = selectIsLocalVideoEnabled(this.store.getState());
      if (isCurrentEnabled === enabled) {
        // why would same value will be set again?
        this.logPossibleInconsistency('local video track muted states.');
      }
      await this.setEnabledTrack(trackID, enabled);
    }
  }

  sendMessage(message: string) {
    if (message.trim() === '') {
      HMSLogger.d('Ignoring empty message send');
      return;
    }
    const sdkMessage = this.sdk.sendMessage(HMSMessageType.CHAT, message);
    const hmsMessage = SDKToHMS.convertMessage(sdkMessage) as HMSMessage;
    hmsMessage.read = true;
    hmsMessage.senderName = 'You';
    this.onHMSMessage(hmsMessage);
  }

  async attachVideo(trackID: string, videoElement: HTMLVideoElement) {
    const sdkTrack = this.hmsSDKTracks[trackID];
    if (sdkTrack && sdkTrack.type === 'video') {
      await (sdkTrack as SDKHMSVideoTrack).addSink(videoElement);
    } else {
      this.logPossibleInconsistency('no video track found to add sink');
    }
  }

  async removeVideo(trackID: string, videoElement: HTMLVideoElement) {
    const sdkTrack = this.hmsSDKTracks[trackID];
    if (sdkTrack && sdkTrack.type === 'video') {
      await (sdkTrack as SDKHMSVideoTrack).removeSink(videoElement);
    } else {
      this.logPossibleInconsistency('no video track found to remove sink');
    }
  }

  private resetState() {
    this.store.setState(store => {
      Object.assign(store, createDefaultStoreState());
    })
    this.isRoomJoinCalled = false;
    this.hmsSDKTracks = {};
  }

  private sdkJoinWithListeners(config: sdkTypes.HMSConfig) {
    this.sdk.join(config, {
      onJoin: this.onJoin.bind(this),
      onRoomUpdate: this.onRoomUpdate.bind(this),
      onPeerUpdate: this.onPeerUpdate.bind(this),
      onTrackUpdate: this.onTrackUpdate.bind(this),
      onMessageReceived: this.onMessageReceived.bind(this),
      onError: this.onError.bind(this),
    });
    this.sdk.addAudioListener({
      onAudioLevelUpdate: this.onAudioLevelUpdate.bind(this),
    });
  }

  private async startScreenShare() {
    const isScreenShared = selectIsLocalScreenShared(this.store.getState());
    if (!isScreenShared) {
      await this.sdk.startScreenShare(this.syncPeers.bind(this));
      this.syncPeers();
    } else {
      this.logPossibleInconsistency("start screenshare is called while it's on")
    }
  }

  private async stopScreenShare() {
    const isScreenShared = selectIsLocalScreenShared(this.store.getState());
    if (isScreenShared) {
      await this.sdk.stopScreenShare();
      this.syncPeers();
    } else {
      this.logPossibleInconsistency("stop screenshare is called while it's not on")
    }
  }

  private async setEnabledTrack(trackID: string, enabled: boolean) {
    this.store.setState(store => {  // show on UI immediately
      if (!store.tracks[trackID]) {
        this.logPossibleInconsistency("track id not found for setEnabled");
      } else {
        store.tracks[trackID].enabled = enabled;
      }
    })
    try {
      await this.setEnabledSDKTrack(trackID, enabled); // do the operation
    } catch (err) {
      // rollback on failure
      this.store.setState(store => {
        store.tracks[trackID].enabled = !enabled;
      })
    }
    this.syncPeers();
  }

  protected syncPeers() {
    const sdkPeers: sdkTypes.HMSPeer[] = this.sdk.getPeers();
    const hmsPeers: Record<HMSPeerID, HMSPeer> = {};
    const hmsPeerIDs: HMSPeerID[] = [];
    const hmsTracks: Record<HMSTrackID, HMSTrack> = {};
    this.hmsSDKTracks = {};
    this.store.setState(store => {
      const oldHMSPeers = selectPeersMap(store);
      const oldHMSTracks = selectTracksMap(store);
      for (let sdkPeer of sdkPeers) {
        let hmsPeer = SDKToHMS.convertPeer(sdkPeer);
        if (hmsPeer.id in oldHMSPeers) {
          // update existing object so if there isn't a change, reference is not changed
          Object.assign(oldHMSPeers[hmsPeer.id], hmsPeer);
          hmsPeer = oldHMSPeers[hmsPeer.id];
        }
        hmsPeers[hmsPeer.id] = hmsPeer as HMSPeer;
        hmsPeerIDs.push(hmsPeer.id);
        this.addPeerTracks(oldHMSTracks, hmsTracks, sdkPeer);
        if (hmsPeer.isLocal) {
          const newSettings: HMSMediaSettings = {
            audioInputDeviceId: (sdkPeer.audioTrack as HMSLocalAudioTrack)?.settings?.deviceId,
            videoInputDeviceId: (sdkPeer.audioTrack as HMSLocalVideoTrack)?.settings?.deviceId,
          }
          Object.assign(store.settings, newSettings);
        }
      }
      if (!this.arraysEqual(store.room.peers, hmsPeerIDs)) {
        store.room.peers = hmsPeerIDs;
      }
      store.peers = hmsPeers;
      store.tracks = hmsTracks;
    });
  }

  private addPeerTracks(
    oldHmsTracks: Record<HMSTrackID, HMSTrack>,
    hmsTracksDraft: Record<HMSTrackID, HMSTrack>,
    sdkPeer: sdkTypes.HMSPeer,
  ) {
    const addTrack = (sdkTrack: SDKHMSTrack) => {
      this.hmsSDKTracks[sdkTrack.trackId] = sdkTrack;
      let hmsTrack = SDKToHMS.convertTrack(sdkTrack);
      if (hmsTrack.id in oldHmsTracks) {
        Object.assign(oldHmsTracks[hmsTrack.id], hmsTrack);
        hmsTrack = oldHmsTracks[hmsTrack.id];
      }
      const mediaSettings = sdkTrack.getMediaTrackSettings();
      hmsTrack.height = mediaSettings.height;
      hmsTrack.width = mediaSettings.width;
      hmsTracksDraft[hmsTrack.id] = hmsTrack;
    };
    if (sdkPeer.audioTrack) {
      addTrack(sdkPeer.audioTrack);
    }
    if (sdkPeer.videoTrack) {
      addTrack(sdkPeer.videoTrack);
    }
    sdkPeer.auxiliaryTracks.forEach(sdkTrack => addTrack(sdkTrack));
  }

  private arraysEqual(arr1: string[], arr2: string[]) {
    if (arr1.length !== arr2.length) {
      return false;
    }
    for (let i = 0; i < arr1.length; ++i) {
      if (arr1[i] !== arr2[i]) {
        return false;
      }
    }
    return true;
  }

  protected onJoin(sdkRoom: sdkTypes.HMSRoom) {
    this.store.setState(store => {
      Object.assign(store.room, SDKToHMS.convertRoom(sdkRoom));
      store.room.isConnected = true;
    })
    this.syncPeers();
  }

  protected onRoomUpdate() {
    this.syncPeers();
  }

  protected onPeerUpdate(
    type: sdkTypes.HMSPeerUpdate,
  ) {
    if (
      type === sdkTypes.HMSPeerUpdate.BECAME_DOMINANT_SPEAKER ||
      type === sdkTypes.HMSPeerUpdate.RESIGNED_DOMINANT_SPEAKER
    ) {
      return; // ignore, high frequency update so no point of syncing peers
    } else {
      this.syncPeers();
    }
  }

  protected onTrackUpdate() {
    this.syncPeers();
  }

  protected onMessageReceived(sdkMessage: sdkTypes.HMSMessage) {
    const hmsMessage = SDKToHMS.convertMessage(sdkMessage) as HMSMessage;
    hmsMessage.read = false;
    hmsMessage.senderName = selectPeerNameByID(
      this.store.getState(),
      hmsMessage.sender,
    );
    this.onHMSMessage(hmsMessage);
  }

  protected onHMSMessage(hmsMessage: HMSMessage) {
    this.store.setState(store => {
      hmsMessage.id = String(selectHMSMessagesCount(this.store.getState()) + 1);
      store.messages.byID[hmsMessage.id] = hmsMessage;
      store.messages.allIDs.push(hmsMessage.id);
    });
  }

  /*
  note: speakers array contain the value only for peers who have audioLevel != 0
   */
  protected onAudioLevelUpdate(sdkSpeakers: sdkTypes.HMSSpeaker[]) {
    this.store.setState(store => {
      const peerIDAudioLevelMap: Record<HMSPeerID, number> = {};
      sdkSpeakers.forEach(sdkSpeaker => {
        peerIDAudioLevelMap[sdkSpeaker.peerId] = sdkSpeaker.audioLevel;
        store.speakers[sdkSpeaker.peerId] = {};
      });
      for (let [peerID, speaker] of Object.entries(store.speakers)) {
        speaker.audioLevel = peerIDAudioLevelMap[peerID] || 0;
      }
    });
  }

  protected onError(error: SDKHMSException) {
    // send notification
    if (Math.floor(error.code/1000) === 1) {  // critical error
      this.leave().then(() => console.log("error from SDK, left room."));
    }
    HMSLogger.e('sdkError', 'received error from sdk', error);
  }

  private async setEnabledSDKTrack(trackID: string, enabled: boolean) {
    const track = this.hmsSDKTracks[trackID];
    if (track) {
      await track.setEnabled(enabled);
    } else {
      this.logPossibleInconsistency(`track ${trackID} not present, unable to enabled/disable`);
    }
  }

  private logPossibleInconsistency(a: string) {
    HMSLogger.w('store', 'possible inconsistency detected - ', a);
  }
}
