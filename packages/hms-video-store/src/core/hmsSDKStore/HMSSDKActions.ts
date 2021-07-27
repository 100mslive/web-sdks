import {
  createDefaultStoreState,
  HMSMediaSettings,
  HMSMessage,
  HMSMessageType,
  HMSPeer,
  HMSPeerID,
  HMSRoomState,
  HMSTrack,
  HMSTrackID,
  HMSTrackSource,
} from '../schema';
import { IHMSActions } from '../IHMSActions';
import * as sdkTypes from './sdkTypes';
import { SDKToHMS } from './adapter';
import {
  selectIsLocalScreenShared,
  selectIsLocalVideoEnabled,
  selectLocalAudioTrackID,
  selectLocalVideoTrackID,
  selectHMSMessagesCount,
  selectPeerNameByID,
  selectIsConnectedToRoom,
  selectIsLocalVideoDisplayEnabled,
  selectLocalPeer,
  selectPeerByID,
  HMSRoleChangeRequest,
} from '../selectors';
import { HMSLogger } from '../../common/ui-logger';
import {
  HMSSdk,
  HMSVideoPlugin,
  HMSTrack as SDKHMSTrack,
  HMSRemoteVideoTrack as SDKHMSRemoteVideoTrack,
  HMSLocalAudioTrack as SDKHMSLocalAudioTrack,
  HMSLocalVideoTrack as SDKHMSLocalVideoTrack,
  HMSAudioTrack as SDKHMSAudioTrack,
  HMSVideoTrack as SDKHMSVideoTrack,
  HMSException as SDKHMSException,
  DeviceMap,
  HMSRoleChangeRequest as SDKHMSRoleChangeRequest,
} from '@100mslive/hms-video';
import { IHMSStore } from '../IHMSStore';

import {
  mergeNewPeersInDraft,
  mergeNewTracksInDraft,
  areArraysEqual,
} from './sdkUtils/storeMergeUtils';
import { HMSAudioTrackSettings, HMSVideoTrackSettings } from './sdkTypes';
import { HMSNotifications } from './HMSNotifications';

/**
 * This class implements the IHMSActions interface for 100ms SDK. It connects with SDK
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
export class HMSSDKActions implements IHMSActions {
  private hmsSDKTracks: Record<string, SDKHMSTrack> = {};
  private hmsSDKPeers: Record<string, sdkTypes.HMSPeer> = {};
  private readonly sdk: HMSSdk;
  private readonly store: IHMSStore;
  private isRoomJoinCalled: boolean = false;
  private hmsNotifications: HMSNotifications;

  constructor(store: IHMSStore, sdk: HMSSdk, notificationManager: HMSNotifications) {
    this.store = store;
    this.sdk = sdk;
    this.hmsNotifications = notificationManager;
  }

  setVolume(value: number, trackId?: HMSTrackID): void {
    if (trackId) {
      this.setTrackVolume(value, trackId);
    } else {
      this.sdk.getAudioOutput().setVolume(value);
      this.syncPeers();
    }
  }

  setAudioOutputDevice(deviceId: string): void {
    this.sdk.getAudioOutput().setDevice(deviceId);
    this.syncPeers();
  }

  setPreferredLayer(trackId: string, layer: sdkTypes.HMSSimulcastLayer) {
    const track = this.hmsSDKTracks[trackId];
    if (track) {
      if (track instanceof SDKHMSRemoteVideoTrack) {
        track.preferLayer(layer);
        this.syncPeers();
      } else {
        HMSLogger.w(`track ${trackId} is not an video track`);
      }
    } else {
      this.logPossibleInconsistency(`track ${trackId} not present, unable to set preffer layer`);
    }
  }

  async preview(config: sdkTypes.HMSConfig) {
    if (this.isRoomJoinCalled) {
      this.logPossibleInconsistency('attempting to call preview after join was called');
      return; // ignore
    }

    try {
      await this.sdkPreviewWithListeners(config);
      this.store.setState(store => {
        store.room.roomState = HMSRoomState.Connecting;
      });
    } catch (err) {
      HMSLogger.e('Cannot show preview. Failed to connect to room - ', err);
      throw err;
    }
  }

  join(config: sdkTypes.HMSConfig) {
    if (this.isRoomJoinCalled) {
      this.logPossibleInconsistency('room join is called again');
      return; // ignore
    }
    try {
      this.sdkJoinWithListeners(config);
      this.isRoomJoinCalled = true;
      this.store.setState(store => {
        store.room.roomState = HMSRoomState.Connecting;
      });
    } catch (err) {
      this.isRoomJoinCalled = false; // so it can be called again if needed
      HMSLogger.e('Failed to connect to room - ', err);
      throw err;
    }
  }

  async leave() {
    const isRoomConnected = this.store.getState(selectIsConnectedToRoom);
    if (!isRoomConnected) {
      this.logPossibleInconsistency('room leave is called when no room is connected');
      return; // ignore
    }
    return this.sdk
      .leave()
      .then(() => {
        this.resetState();
        HMSLogger.i('left room');
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

  async addTrack(track: MediaStreamTrack, type: HMSTrackSource = 'regular') {
    await this.sdk.addTrack(track, type);
    this.syncPeers();
  }

  async removeTrack(trackId: string) {
    await this.sdk.removeTrack(trackId);
    this.syncPeers();
  }

  async setLocalAudioEnabled(enabled: boolean) {
    const trackID = this.store.getState(selectLocalAudioTrackID);
    if (trackID) {
      await this.setEnabledTrack(trackID, enabled);
    }
  }

  async setLocalVideoEnabled(enabled: boolean) {
    const trackID = this.store.getState(selectLocalVideoTrackID);
    if (trackID) {
      await this.setEnabledTrack(trackID, enabled);
    }
  }

  async setEnabledTrack(trackID: string, enabled: boolean) {
    // if mute/unmute is clicked multiple times for same operation, ignore repeated ones
    const alreadyInSameState = this.store.getState().tracks[trackID]?.enabled === enabled;
    if (alreadyInSameState) {
      // it could also be a case of possible inconsistency where UI state is out of sync with truth
      this.logPossibleInconsistency(`local track[${trackID}] enabled state - ${enabled}`);
      return;
    }
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
      throw err;
    }
    const type = enabled
      ? sdkTypes.HMSTrackUpdate.TRACK_UNMUTED
      : sdkTypes.HMSTrackUpdate.TRACK_MUTED;
    this.hmsNotifications.sendTrackUpdate(type, trackID);
  }

  async setAudioSettings(settings: Partial<sdkTypes.HMSAudioTrackSettings>) {
    const trackID = this.store.getState(selectLocalAudioTrackID);
    if (trackID) {
      await this.setSDKLocalAudioTrackSettings(trackID, settings);
      this.syncPeers();
    }
  }

  async setVideoSettings(settings: Partial<sdkTypes.HMSVideoTrackSettings>) {
    const trackID = this.store.getState(selectLocalVideoTrackID);
    if (trackID) {
      await this.setSDKLocalVideoTrackSettings(trackID, settings);
      this.syncPeers();
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
    if (this.localAndVideoUnmuting(trackID)) {
      // wait till video unmute has finished
      return new Promise<void>(resolve => {
        const unsub = this.store.subscribe(async enabled => {
          if (enabled) {
            await this.attachVideoInternal(trackID, videoElement);
            unsub();
            resolve();
          }
        }, selectIsLocalVideoEnabled);
      });
    } else {
      await this.attachVideoInternal(trackID, videoElement);
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

  async addPluginToVideoTrack(plugin: HMSVideoPlugin): Promise<void> {
    return this.addRemoveVideoPlugin(plugin, 'add');
  }

  async removePluginFromVideoTrack(plugin: HMSVideoPlugin): Promise<void> {
    return this.addRemoveVideoPlugin(plugin, 'remove');
  }

  changeRole(forPeerId: string, toRole: string, force: boolean = false) {
    const peer = this.hmsSDKPeers[forPeerId];
    if (!peer) {
      this.logPossibleInconsistency(`Unknown peer ID given ${forPeerId} for changerole`);
      return;
    }
    if (peer.isLocal) {
      HMSLogger.w('changing role for local peer is not yet supported');
      return;
    }
    this.sdk.changeRole(peer as sdkTypes.HMSRemotePeer, toRole, force);
  }

  // TODO: separate out role related things in another file
  acceptChangeRole(request: HMSRoleChangeRequest) {
    const sdkPeer = this.hmsSDKPeers[request.requestedBy.id];
    if (!sdkPeer) {
      HMSLogger.w(
        `peer for which role change is requested no longer available - ${request.requestedBy}`,
      );
      return;
    }
    const sdkRequest = {
      requestedBy: sdkPeer,
      role: request.role,
      token: request.token,
    };
    this.sdk.acceptChangeRole(sdkRequest);
    this.removeRoleChangeRequest(request);
  }

  /**
   * @privateRemarks
   * there is no corresponding sdk method for rejecting change role but as the store also maintains the full
   * state of current pending requests, this method allows it to clean up when the request is rejected
   */
  rejectChangeRole(request: HMSRoleChangeRequest) {
    this.removeRoleChangeRequest(request);
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
      onReconnected: this.onReconnected.bind(this),
      onReconnecting: this.onReconnecting.bind(this),
      onRoleChangeRequest: this.onRoleChangeRequest.bind(this),
      onRoleUpdate: this.onRoleUpdate.bind(this),
      onDeviceChange: this.onDeviceChange.bind(this),
    });
    this.sdk.addAudioListener({
      onAudioLevelUpdate: this.onAudioLevelUpdate.bind(this),
    });
  }

  private onDeviceChange(devices: DeviceMap) {
    this.store.setState(store => {
      if (!areArraysEqual(store.devices.audioInput, devices.audioInput)) {
        store.devices.audioInput = devices.audioInput;
      }
      if (!areArraysEqual(store.devices.videoInput, devices.videoInput)) {
        store.devices.videoInput = devices.videoInput;
      }
      if (!areArraysEqual(store.devices.audioOutput, devices.audioOutput)) {
        store.devices.audioOutput = devices.audioOutput;
      }
    });
    // sync is needed to update the current selected device
    this.syncPeers();
  }

  private async sdkPreviewWithListeners(config: sdkTypes.HMSConfig) {
    await this.sdk.preview(config, {
      onPreview: this.onPreview.bind(this),
      onError: this.onError.bind(this),
      onDeviceChange: this.onDeviceChange.bind(this),
    });
    this.sdk.addAudioListener({
      onAudioLevelUpdate: this.onAudioLevelUpdate.bind(this),
    });
  }

  private async startScreenShare() {
    const isScreenShared = this.store.getState(selectIsLocalScreenShared);
    if (!isScreenShared) {
      await this.sdk.startScreenShare(this.syncPeers.bind(this));
      this.syncPeers();
    } else {
      this.logPossibleInconsistency("start screenshare is called while it's on");
    }
  }

  private async stopScreenShare() {
    const isScreenShared = this.store.getState(selectIsLocalScreenShared);
    if (isScreenShared) {
      await this.sdk.stopScreenShare();
      this.syncPeers();
    } else {
      this.logPossibleInconsistency("stop screenshare is called while it's not on");
    }
  }

  private async attachVideoInternal(trackID: string, videoElement: HTMLVideoElement) {
    const sdkTrack = this.hmsSDKTracks[trackID];
    if (sdkTrack && sdkTrack.type === 'video') {
      await (sdkTrack as SDKHMSVideoTrack).addSink(videoElement);
    } else {
      this.logPossibleInconsistency('no video track found to add sink');
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
      this.hmsSDKPeers[hmsPeer.id] = sdkPeer;

      const sdkTracks = [sdkPeer.audioTrack, sdkPeer.videoTrack, ...sdkPeer.auxiliaryTracks];
      for (let sdkTrack of sdkTracks) {
        if (!sdkTrack) {
          continue;
        }
        const hmsTrack = SDKToHMS.convertTrack(sdkTrack);
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
      mergeNewPeersInDraft(draftPeers, newHmsPeers, newHmsTracks, newHmsSDkTracks);
      mergeNewTracksInDraft(draftTracks, newHmsTracks);
      Object.assign(draftStore.settings, newMediaSettings);
      this.hmsSDKTracks = newHmsSDkTracks;
      Object.assign(draftStore.roles, SDKToHMS.convertRoles(this.sdk.getRoles()));
    });
  }

  protected onPreview(sdkRoom: sdkTypes.HMSRoom) {
    this.store.setState(store => {
      Object.assign(store.room, SDKToHMS.convertRoom(sdkRoom));
      store.room.roomState = HMSRoomState.Preview;
    });
    this.syncPeers();
  }

  protected onJoin(sdkRoom: sdkTypes.HMSRoom) {
    this.store.setState(store => {
      Object.assign(store.room, SDKToHMS.convertRoom(sdkRoom));
      store.room.isConnected = true;
      store.room.roomState = HMSRoomState.Connected;
    });
    this.syncPeers();
  }

  protected onRoomUpdate() {
    this.syncPeers();
  }

  protected onPeerUpdate(type: sdkTypes.HMSPeerUpdate, sdkPeer: sdkTypes.HMSPeer) {
    if (
      type === sdkTypes.HMSPeerUpdate.BECAME_DOMINANT_SPEAKER ||
      type === sdkTypes.HMSPeerUpdate.RESIGNED_DOMINANT_SPEAKER
    ) {
      return; // ignore, high frequency update so no point of syncing peers
    } else {
      // store peer in case it doesn't exist later(will happen if event is peer leave)
      let peer = this.store.getState(selectPeerByID(sdkPeer.peerId));
      this.syncPeers();
      // if peer wasn't available before sync(will happen if event is peer join)
      if (!peer) {
        peer = this.store.getState(selectPeerByID(sdkPeer.peerId));
      }
      this.hmsNotifications.sendPeerUpdate(type, peer);
    }
  }

  protected onTrackUpdate(
    type: sdkTypes.HMSTrackUpdate,
    track: SDKHMSTrack,
    peer: sdkTypes.HMSPeer,
  ) {
    // this check is needed because for track removed case, the store does not have
    // the track info to be sent as notification
    if (type === sdkTypes.HMSTrackUpdate.TRACK_REMOVED) {
      this.hmsNotifications.sendTrackUpdate(type, track.trackId);
      this.handleTrackRemove(track, peer);
    } else {
      this.syncPeers();
      this.hmsNotifications.sendTrackUpdate(type, track.trackId);
    }
  }

  private handleTrackRemove(sdkTrack: SDKHMSTrack, sdkPeer: sdkTypes.HMSPeer) {
    this.store.setState(draftStore => {
      const hmsPeer = draftStore.peers[sdkPeer.peerId];
      const draftTracks = draftStore.tracks;
      // find and remove the exact track from hmsPeer
      if (this.isSameStoreSDKTrack(sdkTrack.trackId, hmsPeer.audioTrack)) {
        delete hmsPeer.audioTrack;
      } else if (this.isSameStoreSDKTrack(sdkTrack.trackId, hmsPeer.videoTrack)) {
        delete hmsPeer.videoTrack;
      } else {
        const auxiliaryIndex = hmsPeer.auxiliaryTracks.indexOf(sdkTrack.trackId);
        if (
          auxiliaryIndex > -1 &&
          this.isSameStoreSDKTrack(sdkTrack.trackId, hmsPeer.auxiliaryTracks[auxiliaryIndex])
        ) {
          hmsPeer.auxiliaryTracks.splice(auxiliaryIndex, 1);
        }
      }
      delete draftTracks[sdkTrack.trackId];
      delete this.hmsSDKTracks[sdkTrack.trackId];
    });
  }

  protected onMessageReceived(sdkMessage: sdkTypes.HMSMessage) {
    const hmsMessage = SDKToHMS.convertMessage(sdkMessage) as HMSMessage;
    hmsMessage.read = false;
    hmsMessage.senderName = this.store.getState(selectPeerNameByID(hmsMessage.sender));
    this.onHMSMessage(hmsMessage);
    this.hmsNotifications.sendMessageReceived(hmsMessage);
  }

  protected onHMSMessage(hmsMessage: HMSMessage) {
    this.store.setState(store => {
      hmsMessage.id = String(this.store.getState(selectHMSMessagesCount) + 1);
      store.messages.byID[hmsMessage.id] = hmsMessage;
      store.messages.allIDs.push(hmsMessage.id);
    });
  }

  /*
  note: speakers array contain the value only for peers who have audioLevel != 0
   */
  protected onAudioLevelUpdate(sdkSpeakers: sdkTypes.HMSSpeaker[]) {
    this.store.setState(store => {
      const trackIDAudioLevelMap: Record<HMSPeerID, number> = {};
      sdkSpeakers.forEach(sdkSpeaker => {
        if (!sdkSpeaker.track) {
          return;
        }
        const trackID = sdkSpeaker.track.trackId;
        trackIDAudioLevelMap[trackID] = sdkSpeaker.audioLevel;
        if (!store.speakers[trackID]) {
          // Set store instances(peers, tracks) references in speaker, not the new ones received.
          store.speakers[trackID] = {
            audioLevel: sdkSpeaker.audioLevel,
            peerID: sdkSpeaker.peer.peerId,
            trackID: trackID,
          };
        }
      });
      const speakerEntries = Object.entries(store.speakers);
      for (let [trackID, speaker] of speakerEntries) {
        speaker.audioLevel = trackIDAudioLevelMap[trackID] || 0;
        if (speaker.audioLevel === 0) {
          delete store.speakers[trackID];
        }
      }
    });
  }

  protected onReconnected() {
    this.syncPeers();
    this.hmsNotifications.sendReconnected();
    this.store.setState(store => {
      store.room.roomState = HMSRoomState.Connected;
    });
  }

  protected onReconnecting(error: SDKHMSException) {
    HMSLogger.e('Reconnection: received error from sdk', error);
    this.hmsNotifications.sendReconnecting(error);
    this.store.setState(store => {
      store.room.roomState = HMSRoomState.Reconnecting;
    });
  }

  protected onError(error: SDKHMSException) {
    if (error.isTerminal) {
      // terminal error leave room as it is not recoverable
      this.leave().then(() => console.log('error from SDK, left room.'));
      this.store.setState(store => {
        store.room.roomState = HMSRoomState.Failed;
      });
    }
    // send notification
    this.hmsNotifications.sendError(error);
    HMSLogger.e('received error from sdk', error);
  }

  private async setEnabledSDKTrack(trackID: string, enabled: boolean) {
    const track = this.hmsSDKTracks[trackID];
    if (track) {
      await track.setEnabled(enabled);
    } else {
      this.logPossibleInconsistency(`track ${trackID} not present, unable to enabled/disable`);
    }
  }

  private async setSDKLocalVideoTrackSettings(
    trackID: string,
    settings: Partial<sdkTypes.HMSVideoTrackSettings>,
  ) {
    const track = this.hmsSDKTracks[trackID];
    if (track) {
      await (track as SDKHMSLocalVideoTrack).setSettings(settings as HMSVideoTrackSettings);
    } else {
      this.logPossibleInconsistency(`local track ${trackID} not present, unable to set settings`);
    }
  }

  private async setSDKLocalAudioTrackSettings(
    trackID: string,
    settings: Partial<sdkTypes.HMSAudioTrackSettings>,
  ) {
    const track = this.hmsSDKTracks[trackID];
    if (track) {
      await (track as SDKHMSLocalAudioTrack).setSettings(settings as HMSAudioTrackSettings);
    } else {
      this.logPossibleInconsistency(`local track ${trackID} not present, unable to set settings`);
    }
  }

  private getMediaSettings(sdkPeer: sdkTypes.HMSPeer): Partial<HMSMediaSettings> {
    return {
      audioInputDeviceId: (sdkPeer.audioTrack as SDKHMSLocalAudioTrack)?.getMediaTrackSettings()
        ?.deviceId,
      videoInputDeviceId: (sdkPeer.videoTrack as SDKHMSLocalVideoTrack)?.getMediaTrackSettings()
        ?.deviceId,
      audioOutputDeviceId: this.sdk.getAudioOutput().getDevice()?.deviceId,
    };
  }

  private setTrackVolume(value: number, trackId: HMSTrackID) {
    const track = this.hmsSDKTracks[trackId];
    if (track) {
      if (track instanceof SDKHMSAudioTrack) {
        track.setVolume(value);
        this.syncPeers();
      } else {
        HMSLogger.w(`track ${trackId} is not an audio track`);
      }
    } else {
      this.logPossibleInconsistency(`track ${trackId} not present, unable to set volume`);
    }
  }

  /**
   * Tells if the trackID is for local peer and video unmute is in process
   * @private
   */
  private localAndVideoUnmuting(trackID: string) {
    const localPeer = this.store.getState(selectLocalPeer);
    if (localPeer.videoTrack !== trackID) {
      return false;
    }
    const displayEnabled = this.store.getState(selectIsLocalVideoDisplayEnabled);
    const actuallyEnabled = this.store.getState(selectIsLocalVideoEnabled);
    return displayEnabled && !actuallyEnabled;
  }

  private logPossibleInconsistency(inconsistency: string) {
    HMSLogger.w('possible inconsistency detected - ', inconsistency);
  }

  private async addRemoveVideoPlugin(plugin: HMSVideoPlugin, action: 'add' | 'remove') {
    if (!plugin) {
      HMSLogger.w('Invalid plugin received in store');
      return;
    }
    const trackID = this.store.getState(selectLocalVideoTrackID);
    if (trackID) {
      const sdkTrack = this.hmsSDKTracks[trackID];
      if (sdkTrack) {
        if (action === 'add') {
          await (sdkTrack as SDKHMSLocalVideoTrack).addPlugin(plugin);
        } else if (action === 'remove') {
          await (sdkTrack as SDKHMSLocalVideoTrack).removePlugin(plugin);
        }
        this.syncPeers();
      } else {
        this.logPossibleInconsistency(`track ${trackID} not present, unable to remove plugin`);
      }
    }
  }

  /**
   * In case of replace track id is changed but not in store. Given the store id, check the real id
   * sdk is using to refer to the track and match them.
   */
  private isSameStoreSDKTrack(sdkTrackID: string, storeTrackID?: string): boolean {
    if (!storeTrackID) {
      return false;
    }
    return this.hmsSDKTracks[storeTrackID]?.trackId === sdkTrackID;
  }

  /**
   * convert new role change requests to store format and save.
   * keep only one request at a time in store till we figure out how to handle multiple requests at the same time
   */
  private onRoleChangeRequest(request: SDKHMSRoleChangeRequest) {
    this.store.setState(store => {
      if (store.roleChangeRequests.length === 0) {
        store.roleChangeRequests.push(SDKToHMS.convertRoleChangeRequest(request));
      }
    });
  }

  private removeRoleChangeRequest(toRemove: HMSRoleChangeRequest) {
    this.store.setState(store => {
      const index = store.roleChangeRequests.findIndex(req => {
        return (
          req.requestedBy === toRemove.requestedBy.id &&
          req.roleName === toRemove.role.name &&
          req.token === toRemove.token
        );
      });
      if (index !== -1) {
        store.roleChangeRequests.splice(index, 1);
      }
    });
  }

  private onRoleUpdate() {
    this.syncPeers();
  }
}
