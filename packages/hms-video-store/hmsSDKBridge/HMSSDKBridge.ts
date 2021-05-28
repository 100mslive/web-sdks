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
  selectIsConnectedToRoom,
} from '../selectors';
import HMSLogger from '../../utils/ui-logger';
import { HMSSdk } from '@100mslive/hms-video';
import { IHMSStore } from '../IHMSStore';
import SDKHMSException from '@100mslive/hms-video/dist/error/HMSException';
import SDKHMSVideoTrack from '@100mslive/hms-video/dist/media/tracks/HMSVideoTrack';
import SDKHMSTrack from '@100mslive/hms-video/dist/media/tracks/HMSTrack';
import HMSLocalAudioTrack from '@100mslive/hms-video/dist/media/tracks/HMSLocalAudioTrack';
import HMSLocalVideoTrack from '@100mslive/hms-video/dist/media/tracks/HMSLocalVideoTrack';
import merge from 'lodash/merge';
import {
  mergeNewPeersInDraft,
  mergeNewTracksInDraft,
} from './sdkUtils/storeMergeUtils';

/**
 * This class implements the HMSBridge interface for 100ms SDK. It connects with SDK
 * and takes control of data management by letting every action pass through it. The
 * passed in store is ensured to be the single source of truth reflecting current
 * room related data at any point in time.
 *
 * @privateRemarks
 * Things to keep in mind while updating store -
 * 1. Treat setState as an atomic operation, if an action results in multiple changes,
 *    the changes should all happen within single setState function.
 * 2. While updating the state it's very important to not update the reference if
 *    something is unchanged. Copy data in same reference object don't assign new
 *    object.
 * 3. Mental Model(1) - Actions from backend -> Listeners of this class -> update store -> views update themselves
 *    eg. for this - peer added, remote muted etc.
 * 4. Mental Model(2) - Actions from local -> View calls actions -> update store -> views update themselves
 *    eg. local track enabled, join, leave etc.
 * 5. State is immutable, a new copy with new references is created when there is a change,
 *    if you try to modify state outside of setState, there'll be an error.
 */
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
      HMSLogger.e('Failed to connect to room - ', err);
      return;
    }
  }

  async leave() {
    const isRoomConnected = selectIsConnectedToRoom(this.store.getState());
    if (!isRoomConnected) {
      this.logPossibleInconsistency(
        'room leave is called when no room is connected',
      );
      return; // ignore
    }
    return this.sdk
      .leave()
      .then(() => {
        this.resetState();
        HMSLogger.i('sdk', 'left room');
      })
      .catch(err => {
        HMSLogger.e('error in leaving room - ', err);
      });
  }

  async setScreenShareEnabled(enabled: boolean) {
    if (enabled) {
      await this.startScreenShare();
    } else {
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

  async setAudioSettings(settings: Partial<sdkTypes.HMSAudioTrackSettings>) {
    const trackID = selectLocalAudioTrackID(this.store.getState());
    const currentSettings = this.store.getState().settings;
    if (trackID) {
      // TODO: Handle other settings changes
      if (
        settings.deviceId &&
        currentSettings.audioInputDeviceId !== settings.deviceId
      ) {
        await this.setSDKLocalTrackSettings(trackID, settings);
        this.syncPeers();
      }
    }
  }

  async setVideoSettings(settings: Partial<sdkTypes.HMSVideoTrackSettings>) {
    const trackID = selectLocalVideoTrackID(this.store.getState());
    const currentSettings = this.store.getState().settings;
    if (trackID) {
      // TODO: Handle other settings changes
      if (
        settings.deviceId &&
        currentSettings.videoInputDeviceId !== settings.deviceId
      ) {
        await this.setSDKLocalTrackSettings(trackID, settings);
        this.syncPeers();
      }
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
  setMessageRead(readStatus: boolean, messageId?: string) {
    this.store.setState(store => {
      if (messageId) {
        if (!store.messages.byID[messageId]) {
          this.logPossibleInconsistency('no message with id is found');
        } else {
          store.messages.byID[messageId].read = readStatus;
        }
      } else {
        store.messages.allIDs.forEach((id: string) => {
          store.messages.byID[id].read = readStatus;
        });
      }
    });
  }

  async attachVideo(trackID: string, videoElement: HTMLVideoElement) {
    const sdkTrack = this.hmsSDKTracks[trackID];
    if (sdkTrack && sdkTrack.type === 'video') {
      await (sdkTrack as SDKHMSVideoTrack).addSink(videoElement);
    } else {
      this.logPossibleInconsistency('no video track found to add sink');
    }
  }

  async detachVideo(trackID: string, videoElement: HTMLVideoElement) {
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
    });
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
      this.logPossibleInconsistency(
        "start screenshare is called while it's on",
      );
    }
  }

  private async stopScreenShare() {
    const isScreenShared = selectIsLocalScreenShared(this.store.getState());
    if (isScreenShared) {
      await this.sdk.stopScreenShare();
      this.syncPeers();
    } else {
      this.logPossibleInconsistency(
        "stop screenshare is called while it's not on",
      );
    }
  }

  private async setEnabledTrack(trackID: string, enabled: boolean) {
    this.store.setState(store => {
      // show on UI immediately
      if (!store.tracks[trackID]) {
        this.logPossibleInconsistency('track id not found for setEnabled');
      } else {
        store.tracks[trackID].displayEnabled = enabled;
      }
    });
    try {
      await this.setEnabledSDKTrack(trackID, enabled); // do the operation
      this.syncPeers();
    } catch (err) {
      // rollback on failure
      this.store.setState(store => {
        store.tracks[trackID].displayEnabled = !enabled;
      });
    }
  }

  /**
   * This is a very important function as it's responsible for maintaining the source of
   * truth with maximum efficiency. The efficiency comes from the fact that the only
   * those portions of the store are updated which have actually changed.
   * While making a change in this function don't use functions like map, reduce etc.
   * which return a new copy of the data. Use Object.assign etc. to ensure that if the data
   * doesn't change reference is also not changed.
   * The UI and selectors rely on the fact that the store is immutable that is if there is
   * any change and only if there is a change, they'll get a new copy of the data they're
   * interested in with a new reference.
   * @protected
   */
  protected syncPeers() {
    const newHmsPeers: Record<HMSPeerID, Partial<HMSPeer>> = {};
    const newHmsPeerIDs: HMSPeerID[] = []; // to add in room.peers
    const newHmsTracks: Record<HMSTrackID, Partial<HMSTrack>> = {};
    const newHmsSDkTracks: Record<HMSTrackID, SDKHMSTrack> = {};
    const newMediaSettings: Partial<HMSMediaSettings> = {};

    const sdkPeers: sdkTypes.HMSPeer[] = this.sdk.getPeers();

    // first convert everything in the new format
    for (let sdkPeer of sdkPeers) {
      const hmsPeer = SDKToHMS.convertPeer(sdkPeer);
      newHmsPeers[hmsPeer.id] = hmsPeer;
      newHmsPeerIDs.push(hmsPeer.id);

      const sdkTracks = [
        sdkPeer.audioTrack,
        sdkPeer.videoTrack,
        ...sdkPeer.auxiliaryTracks,
      ];
      for (let sdkTrack of sdkTracks) {
        if (!sdkTrack) {
          continue;
        }
        const hmsTrack = SDKToHMS.convertTrack(sdkTrack);
        this.enrichHMSTrack(hmsTrack, sdkTrack); // fill in video width/height
        newHmsTracks[hmsTrack.id] = hmsTrack;
        newHmsSDkTracks[sdkTrack.trackId] = sdkTrack;
      }

      if (hmsPeer.isLocal) {
        Object.assign(newMediaSettings, this.getMediaSettings(sdkPeer));
      }
    }

    // then merge them carefully with our store so if something hasn't changed
    // the reference shouldn't change. Note that the draftStore is an immer draft
    // object.
    this.store.setState(draftStore => {
      draftStore.room.peers = newHmsPeerIDs;
      const draftPeers = draftStore.peers;
      const draftTracks = draftStore.tracks;
      // the order of below statements are important as merge functions are mutating
      mergeNewPeersInDraft(
        draftPeers,
        newHmsPeers,
        newHmsTracks,
        newHmsSDkTracks,
      );
      mergeNewTracksInDraft(draftTracks, newHmsTracks);
      Object.assign(draftStore.settings, newMediaSettings);
      this.hmsSDKTracks = newHmsSDkTracks;
    });
  }

  protected onJoin(sdkRoom: sdkTypes.HMSRoom) {
    this.store.setState(store => {
      Object.assign(store.room, SDKToHMS.convertRoom(sdkRoom));
      store.room.isConnected = true;
    });
    this.syncPeers();
  }

  protected onRoomUpdate() {
    this.syncPeers();
  }

  protected onPeerUpdate(type: sdkTypes.HMSPeerUpdate) {
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
        if (!store.speakers[sdkSpeaker.peerId]) {
          store.speakers[sdkSpeaker.peerId] = {};
        }
      });
      const speakerEntries = Object.entries(store.speakers);
      for (let [peerID, speaker] of speakerEntries) {
        speaker.audioLevel = peerIDAudioLevelMap[peerID] || 0;
        if (speaker.audioLevel === 0) {
          delete store.speakers[peerID];
        }
      }
    });
  }

  protected onError(error: SDKHMSException) {
    // send notification
    if (Math.floor(error.code / 1000) === 1) {
      // critical error
      this.leave().then(() => console.log('error from SDK, left room.'));
    }
    HMSLogger.e('sdkError', 'received error from sdk', error);
  }

  private async setEnabledSDKTrack(trackID: string, enabled: boolean) {
    const track = this.hmsSDKTracks[trackID];
    if (track) {
      await track.setEnabled(enabled);
    } else {
      this.logPossibleInconsistency(
        `track ${trackID} not present, unable to enabled/disable`,
      );
    }
  }

  private async setSDKLocalTrackSettings(
    trackID: string,
    settings:
      | Partial<sdkTypes.HMSAudioTrackSettings>
      | Partial<sdkTypes.HMSVideoTrackSettings>,
  ) {
    const track = this.hmsSDKTracks[trackID];
    // TODO: Export type from sdk-index(instead of dist) to use instanceOf
    if (
      track &&
      (track.constructor.name === 'HMSLocalAudioTrack' ||
        track.constructor.name === 'HMSLocalVideoTrack')
    ) {
      // Clone track.settings - lodash.merge overrides destination(first parameter)
      // track.settings should be updated only in the SDK.
      // @ts-expect-error
      const newSettings = merge({ ...track.settings }, settings);
      // @ts-expect-error
      await track.setSettings(newSettings);
    } else {
      this.logPossibleInconsistency(
        `local track ${trackID} not present, unable to set settings`,
      );
    }
  }

  private enrichHMSTrack(hmsTrack: HMSTrack, sdkTrack: SDKHMSTrack) {
    const mediaSettings = sdkTrack.getMediaTrackSettings();
    hmsTrack.height = mediaSettings.height;
    hmsTrack.width = mediaSettings.width;
  }

  private getMediaSettings(
    sdkPeer: sdkTypes.HMSPeer,
  ): Partial<HMSMediaSettings> {
    return {
      audioInputDeviceId: (sdkPeer.audioTrack as HMSLocalAudioTrack)?.settings
        ?.deviceId,
      videoInputDeviceId: (sdkPeer.audioTrack as HMSLocalVideoTrack)?.settings
        ?.deviceId,
    };
  }

  private logPossibleInconsistency(a: string) {
    HMSLogger.w('store', 'possible inconsistency detected - ', a);
  }
}
