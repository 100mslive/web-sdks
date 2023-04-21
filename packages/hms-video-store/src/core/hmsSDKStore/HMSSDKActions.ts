import {
  HMSAudioPlugin,
  HMSAudioTrack as SDKHMSAudioTrack,
  HMSChangeMultiTrackStateParams as SDKHMSChangeMultiTrackStateParams,
  HMSChangeMultiTrackStateRequest as SDKHMSChangeMultiTrackStateRequest,
  HMSChangeTrackStateRequest as SDKHMSChangeTrackStateRequest,
  HMSException as SDKHMSException,
  HMSLeaveRoomRequest as SDKHMSLeaveRoomRequest,
  HMSLocalAudioTrack as SDKHMSLocalAudioTrack,
  HMSLocalTrack as SDKHMSLocalTrack,
  HMSLocalVideoTrack as SDKHMSLocalVideoTrack,
  HMSLogLevel,
  HMSPluginSupportResult,
  HMSRemoteTrack as SDKHMSRemoteTrack,
  HMSRemoteVideoTrack as SDKHMSRemoteVideoTrack,
  HMSRoleChangeRequest as SDKHMSRoleChangeRequest,
  HMSScreenShareConfig,
  HMSSdk,
  HMSSimulcastLayer,
  HMSTrack as SDKHMSTrack,
  HMSVideoPlugin,
  HMSVideoTrack as SDKHMSVideoTrack,
  SessionStoreUpdate,
} from '@100mslive/hms-video';
import { PEER_NOTIFICATION_TYPES, TRACK_NOTIFICATION_TYPES } from './common/mapping';
import { isRemoteTrack } from './sdkUtils/sdkUtils';
import { areArraysEqual, mergeNewPeersInDraft, mergeNewTracksInDraft } from './sdkUtils/storeMergeUtils';
import { SDKToHMS } from './adapter';
import { HMSNotifications } from './HMSNotifications';
import { HMSPlaylist } from './HMSPlaylist';
import { HMSSessionStore } from './HMSSessionStore';
import { NamedSetState } from './internalTypes';
import * as sdkTypes from './sdkTypes';
import { HMSLogger } from '../../common/ui-logger';
import { BeamSpeakerLabelsLogger } from '../../controller/beam/BeamSpeakerLabelsLogger';
import { IHMSActions } from '../IHMSActions';
import { IHMSStore } from '../IHMSStore';
import {
  createDefaultStoreState,
  HMSChangeMultiTrackStateParams,
  HMSGenericTypes,
  HMSMediaSettings,
  HMSMessage,
  HMSMessageInput,
  HMSPeer,
  HMSPeerID,
  HMSPlaylistType,
  HMSRoleName,
  HMSRoomState,
  HMSStore,
  HMSTrack,
  HMSTrackID,
  HMSTrackSource,
  HMSVideoTrack,
  IHMSPlaylistActions,
  IHMSSessionStoreActions,
} from '../schema';
import {
  HMSRoleChangeRequest,
  selectHMSMessagesCount,
  selectIsConnectedToRoom,
  selectIsLocalScreenShared,
  selectIsLocalVideoDisplayEnabled,
  selectIsLocalVideoEnabled,
  selectLocalAudioTrackID,
  selectLocalMediaSettings,
  selectLocalPeer,
  selectLocalTrackIDs,
  selectLocalVideoTrackID,
  selectPeerByID,
  selectPeersMap,
  selectPermissions,
  selectRolesMap,
  selectRoomState,
  selectTrackByID,
  selectTracksMap,
  selectVideoTrackByID,
} from '../selectors';

// import { ActionBatcher } from './sdkUtils/ActionBatcher';

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
export class HMSSDKActions<T extends HMSGenericTypes = { sessionStore: Record<string, any> }>
  implements IHMSActions<T>
{
  private hmsSDKTracks: Record<string, SDKHMSTrack> = {};
  private hmsSDKPeers: Record<string, sdkTypes.HMSPeer> = {};
  private readonly sdk: HMSSdk;
  private readonly store: IHMSStore<T>;
  private isRoomJoinCalled = false;
  private hmsNotifications: HMSNotifications<T>;
  private ignoredMessageTypes: string[] = [];
  // private actionBatcher: ActionBatcher;
  audioPlaylist!: IHMSPlaylistActions;
  videoPlaylist!: IHMSPlaylistActions;
  sessionStore: IHMSSessionStoreActions<T['sessionStore']>;
  private beamSpeakerLabelsLogger?: BeamSpeakerLabelsLogger<T>;

  constructor(store: IHMSStore<T>, sdk: HMSSdk, notificationManager: HMSNotifications<T>) {
    this.store = store;
    this.sdk = sdk;
    this.hmsNotifications = notificationManager;

    this.sessionStore = new HMSSessionStore<T['sessionStore']>(this.sdk, this.setSessionStoreValueLocally.bind(this));

    // this.actionBatcher = new ActionBatcher(store);
  }

  async refreshDevices() {
    await this.sdk.refreshDevices();
  }

  async unblockAudio() {
    await this.sdk.getAudioOutput().unblockAutoplay();
  }

  async setVolume(value: number, trackId?: HMSTrackID) {
    if (trackId) {
      await this.setTrackVolume(value, trackId);
    } else {
      await this.sdk.getAudioOutput().setVolume(value);
      this.syncRoomState('setOutputVolume');
    }
  }

  async setAudioOutputDevice(deviceId: string): Promise<void> {
    const deviceInfo = await this.sdk.getAudioOutput().setDevice(deviceId);
    if (deviceInfo) {
      this.setState(draftStore => {
        draftStore.settings.audioOutputDeviceId = deviceId;
      }, 'setAudioOutputDevice');
    }
  }

  async setPreferredLayer(trackId: string, layer: sdkTypes.HMSPreferredSimulcastLayer) {
    const track = this.hmsSDKTracks[trackId];
    if (track) {
      if (track instanceof SDKHMSRemoteVideoTrack) {
        //@ts-ignore
        if (layer === HMSSimulcastLayer.NONE) {
          HMSLogger.d(`layer ${HMSSimulcastLayer.NONE} will be ignored`);
          return;
        }
        const alreadyInSameState = this.store.getState(selectVideoTrackByID(trackId))?.preferredLayer === layer;
        if (alreadyInSameState) {
          HMSLogger.d(`preferred layer is already ${layer}`);
          return;
        }
        this.setState(draftStore => {
          const track = draftStore.tracks[trackId] as HMSVideoTrack;
          if (track) {
            track.preferredLayer = layer;
          }
        }, 'setPreferredLayer');
        await track.setPreferredLayer(layer);
      } else {
        HMSLogger.d(`track ${trackId} is not a remote video track`);
      }
    } else {
      this.logPossibleInconsistency(`track ${trackId} not present, unable to set preffer layer`);
    }
  }

  getAuthTokenByRoomCode(
    tokenRequest: sdkTypes.TokenRequest,
    tokenRequestOptions?: sdkTypes.TokenRequestOptions,
  ): Promise<string> {
    return this.sdk.getAuthTokenByRoomCode(tokenRequest, tokenRequestOptions);
  }

  async preview(config: sdkTypes.HMSPreviewConfig) {
    if (this.isRoomJoinCalled) {
      this.logPossibleInconsistency('attempting to call preview after join was called');
      return; // ignore
    }
    const roomState = this.store.getState(selectRoomState);
    if (roomState === HMSRoomState.Preview || roomState === HMSRoomState.Connecting) {
      this.logPossibleInconsistency('attempting to call preview while room is in preview/connecting');
      return;
    }

    try {
      this.setState(store => {
        store.room.roomState = HMSRoomState.Connecting;
      }, 'connecting');
      await this.sdkPreviewWithListeners(config);
    } catch (err) {
      HMSLogger.e('Cannot show preview. Failed to connect to room - ', err);
      throw err;
    }
  }

  async join(config: sdkTypes.HMSConfig) {
    if (this.isRoomJoinCalled) {
      this.logPossibleInconsistency('room join is called again');
      return; // ignore
    }
    try {
      this.isRoomJoinCalled = true;
      this.setState(store => {
        store.room.roomState = HMSRoomState.Connecting;
      }, 'join');
      await this.sdkJoinWithListeners(config);
    } catch (err) {
      this.isRoomJoinCalled = false; // so it can be called again if needed
      HMSLogger.e('Failed to connect to room - ', err);
      throw err;
    }
  }

  async leave() {
    const isConnectedToRoom = this.store.getState(selectIsConnectedToRoom);
    let notifyServer = true;
    if (!isConnectedToRoom) {
      notifyServer = false;
      this.logPossibleInconsistency('room leave is called when no room is connected');
    }
    const currentRoomState = this.store.getState(selectRoomState);
    this.setState(store => {
      store.room.roomState = HMSRoomState.Disconnecting;
    }, 'leaving');
    return this.sdk
      .leave(notifyServer)
      .then(() => {
        this.resetState('leave');
        if (this.beamSpeakerLabelsLogger) {
          this.beamSpeakerLabelsLogger.stop().catch(HMSLogger.e);
        }
        HMSLogger.i('left room');
      })
      .catch(err => {
        HMSLogger.e('error in leaving room - ', err);
        this.setState(store => {
          store.room.roomState = currentRoomState;
        }, 'revertLeave');
      });
  }

  async setScreenShareEnabled(enabled: boolean, config?: HMSScreenShareConfig) {
    // TODO: remove this, purely for backward compatibility
    if (typeof config === 'boolean') {
      config = { audioOnly: config };
    }
    try {
      if (enabled) {
        await this.startScreenShare(config);
      } else {
        await this.stopScreenShare();
      }
    } catch (error) {
      this.hmsNotifications.sendError(SDKToHMS.convertException(error as SDKHMSException));
      throw error;
    }
  }

  async addTrack(track: MediaStreamTrack, type: HMSTrackSource = 'regular') {
    await this.sdk.addTrack(track, type);
    this.syncRoomState('addTrack');
  }

  async removeTrack(trackId: string) {
    await this.sdk.removeTrack(trackId);
    this.syncRoomState('removeTrack');
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
    this.setState(store => {
      // show on UI immediately
      if (!store.tracks[trackID]) {
        this.logPossibleInconsistency('track id not found for setEnabled');
      } else {
        store.tracks[trackID].displayEnabled = enabled;
      }
    }, 'displayEnabled');
    try {
      await this.setEnabledSDKTrack(trackID, enabled); // do the operation
      this.syncRoomState('setEnabled');
    } catch (err) {
      // rollback on failure
      this.setState(store => {
        store.tracks[trackID].displayEnabled = !enabled;
      }, 'rollbackDisplayEnabled');
      this.hmsNotifications.sendError(SDKToHMS.convertException(err as SDKHMSException));
      throw err;
    }
    const type = enabled ? sdkTypes.HMSTrackUpdate.TRACK_UNMUTED : sdkTypes.HMSTrackUpdate.TRACK_MUTED;
    this.hmsNotifications.sendTrackUpdate(type, trackID);
  }

  async setAudioSettings(settings: Partial<sdkTypes.HMSAudioTrackSettings>) {
    const trackID = this.store.getState(selectLocalAudioTrackID);
    if (trackID) {
      await this.setSDKLocalAudioTrackSettings(trackID, settings);
      this.syncRoomState('setAudioSettings');
    }
  }

  async setVideoSettings(settings: Partial<sdkTypes.HMSVideoTrackSettings>) {
    const trackID = this.store.getState(selectLocalVideoTrackID);
    if (trackID) {
      await this.setSDKLocalVideoTrackSettings(trackID, settings);
      this.syncRoomState('setVideoSettings');
    }
  }

  async switchCamera(): Promise<void> {
    const trackID = this.store.getState(selectLocalVideoTrackID);
    if (trackID) {
      const sdkTrack = this.hmsSDKTracks[trackID] as SDKHMSLocalVideoTrack;
      if (sdkTrack) {
        await sdkTrack.switchCamera();
        this.syncRoomState('switchCamera');
      }
    }
  }

  sendMessage(message: string) {
    this.sendBroadcastMessage(message);
  }

  async sendBroadcastMessage(message: string, type?: string) {
    const sdkMessage = await this.sdk.sendBroadcastMessage(message, type);
    this.updateMessageInStore(sdkMessage, { message, type });
  }

  async sendGroupMessage(message: string, roles: string[], type?: string) {
    const storeRoles = this.store.getState(selectRolesMap);
    const hmsRoles = roles.map(roleName => {
      return storeRoles[roleName];
    });
    const sdkMessage = await this.sdk.sendGroupMessage(message, hmsRoles, type);
    this.updateMessageInStore(sdkMessage, { message, recipientRoles: roles, type });
  }

  async sendDirectMessage(message: string, peerID: string, type?: string) {
    const hmsPeer = this.hmsSDKPeers[peerID];
    const sdkMessage = await this.sdk.sendDirectMessage(message, hmsPeer, type);
    this.updateMessageInStore(sdkMessage, { message, recipientPeer: hmsPeer.peerId, type });
  }

  private updateMessageInStore(sdkMessage: sdkTypes.HMSMessage | void, messageInput: string | HMSMessageInput) {
    if (!sdkMessage) {
      HMSLogger.w('sendMessage', 'Failed to send message', messageInput);
      throw Error(`sendMessage Failed - ${JSON.stringify(messageInput)}`);
    }
    const hmsMessage = SDKToHMS.convertMessage(sdkMessage) as HMSMessage;
    hmsMessage.read = true;
    hmsMessage.senderName = 'You';
    hmsMessage.ignored = this.ignoredMessageTypes.includes(hmsMessage.type);
    this.putMessageInStore(hmsMessage);
    return hmsMessage;
  }

  setMessageRead(readStatus: boolean, messageId?: string) {
    this.setState(store => {
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
    }, 'setMessageRead');
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
    if (sdkTrack?.type === 'video') {
      await this.sdk.detachVideo(sdkTrack as SDKHMSVideoTrack, videoElement);
    } else {
      if (videoElement) {
        videoElement.srcObject = null; // so chrome can clean up
      }
      HMSLogger.d('possible inconsistency detected - no video track found to remove sink');
    }
  }

  async addPluginToVideoTrack(plugin: HMSVideoPlugin, pluginFrameRate?: number): Promise<void> {
    return this.addRemoveVideoPlugin(plugin, 'add', pluginFrameRate);
  }
  async addPluginToAudioTrack(plugin: HMSAudioPlugin): Promise<void> {
    return this.addRemoveAudioPlugin(plugin, 'add');
  }

  validateVideoPluginSupport(plugin: HMSVideoPlugin): HMSPluginSupportResult {
    let result = {} as HMSPluginSupportResult;
    result.isSupported = false; //Setting default to false
    if (!plugin) {
      HMSLogger.w('no plugin passed in for checking support');
      result.errMsg = 'no plugin passed in for checking support';
      return result;
    }
    const trackID = this.store.getState(selectLocalVideoTrackID);
    if (!trackID) {
      HMSLogger.w('video Track not added to local peer yet');
      result.errMsg = 'call this function only after local peer has video track';
      return result;
    }
    const sdkTrack = this.hmsSDKTracks[trackID];
    if (sdkTrack) {
      result = (sdkTrack as SDKHMSLocalVideoTrack).validatePlugin(plugin);
    } else {
      HMSLogger.w(`track ${trackID} not present, unable to validate plugin`);
      result.errMsg = `track ${trackID} not present, unable to validate plugin`;
    }

    return result;
  }

  validateAudioPluginSupport(plugin: HMSAudioPlugin): HMSPluginSupportResult {
    let result = {} as HMSPluginSupportResult;
    result.isSupported = false; //Setting default to false
    if (!plugin) {
      HMSLogger.w('no plugin passed in for checking support"');
      result.errMsg = 'no plugin passed in for checking support"';
      return result;
    }
    const trackID = this.store.getState(selectLocalAudioTrackID);
    if (!trackID) {
      HMSLogger.w('audio track not added to local peer yet');
      result.errMsg = 'call this function only after local peer has audio track';
      return result;
    }
    const sdkTrack = this.hmsSDKTracks[trackID];
    if (sdkTrack) {
      result = (sdkTrack as SDKHMSLocalAudioTrack).validatePlugin(plugin);
    } else {
      HMSLogger.w(`track ${trackID} not present, unable to validate plugin`);
      result.errMsg = `track ${trackID} not present, unable to validate plugin`;
    }

    return result;
  }

  async removePluginFromVideoTrack(plugin: HMSVideoPlugin): Promise<void> {
    return this.addRemoveVideoPlugin(plugin, 'remove');
  }
  async removePluginFromAudioTrack(plugin: HMSAudioPlugin): Promise<void> {
    return this.addRemoveAudioPlugin(plugin, 'remove');
  }

  async changeRole(forPeerId: string, toRole: string, force = false) {
    const peer = this.hmsSDKPeers[forPeerId];
    if (!peer) {
      this.logPossibleInconsistency(`Unknown peer ID given ${forPeerId} for changerole`);
      return;
    }

    await this.sdk.changeRoleOfPeer(peer, toRole, force);
  }

  async changeRoleOfPeer(forPeerId: string, toRole: string, force = false) {
    const peer = this.hmsSDKPeers[forPeerId];
    if (!peer) {
      this.logPossibleInconsistency(`Unknown peer ID given ${forPeerId} for changerole`);
      return;
    }

    await this.sdk.changeRoleOfPeer(peer, toRole, force);
  }

  async changeRoleOfPeersWithRoles(roles: HMSRoleName[], toRole: HMSRoleName) {
    const rolesToBeChanged = this.sdk.getRoles().filter(role => roles.includes(role.name));
    await this.sdk.changeRoleOfPeersWithRoles(rolesToBeChanged, toRole);
  }

  // TODO: separate out role related things in another file
  async acceptChangeRole(request: HMSRoleChangeRequest) {
    const sdkPeer: sdkTypes.HMSPeer | undefined = request.requestedBy
      ? this.hmsSDKPeers[request.requestedBy.id]
      : undefined;
    if (!sdkPeer) {
      HMSLogger.w(`peer for which role change is requested no longer available - ${request.requestedBy}`);
    }
    const sdkRequest = {
      requestedBy: sdkPeer,
      role: request.role,
      token: request.token,
    };
    // TODO: hotfix for HMS-3639. Needs a better solution
    await this.sdk.acceptChangeRole(sdkRequest);
    this.removeRoleChangeRequest(request);
  }

  initAppData(appData: Record<string, any>) {
    this.setState(store => {
      store.appData = appData;
    }, 'initAppData');
  }

  setAppData(key: string, value: any, merge?: boolean) {
    const isValueObject = value?.constructor.name === 'Object';
    this.setState(store => {
      if (store.appData) {
        if (merge && isValueObject) {
          Object.assign(store.appData[key], value);
        } else {
          store.appData[key] = value;
        }
      } else {
        const newAppData = {
          [key]: value,
        };
        store.appData = newAppData;
      }
    }, `setAppData-${key}`);
  }

  /**
   * @privateRemarks
   * there is no corresponding sdk method for rejecting change role but as the store also maintains the full
   * state of current pending requests, this method allows it to clean up when the request is rejected
   */
  rejectChangeRole(request: HMSRoleChangeRequest) {
    this.removeRoleChangeRequest(request);
  }

  async endRoom(lock: boolean, reason: string) {
    const permissions = this.store.getState(selectPermissions);
    if (!permissions?.endRoom) {
      HMSLogger.w('You are not allowed to perform this action - endRoom');
      return;
    }
    const currentRoomState = this.store.getState(selectRoomState);
    this.setState(store => {
      store.room.roomState = HMSRoomState.Disconnecting;
    }, 'endingRoom');
    try {
      await this.sdk.endRoom(lock, reason);
      this.resetState('endRoom');
    } catch (err) {
      HMSLogger.e('error in ending room - ', err);
      this.setState(store => {
        store.room.roomState = currentRoomState;
      }, 'revertEndRoom');
    }
  }

  async removePeer(peerID: string, reason: string) {
    const peer = this.hmsSDKPeers[peerID];
    if (peer && !peer.isLocal) {
      await this.sdk.removePeer(peer as sdkTypes.HMSRemotePeer, reason);
    } else {
      this.logPossibleInconsistency(`No remote peer found for peerID - ${peerID}`);
      return;
    }
  }

  async startRTMPOrRecording(params: sdkTypes.RTMPRecordingConfig) {
    await this.sdk.startRTMPOrRecording(params);
  }

  async stopRTMPAndRecording() {
    await this.sdk.stopRTMPAndRecording();
  }

  async startHLSStreaming(params?: sdkTypes.HLSConfig) {
    await this.sdk.startHLSStreaming(params);
  }

  async stopHLSStreaming(params?: sdkTypes.HLSConfig): Promise<void> {
    await this.sdk.stopHLSStreaming(params);
  }

  async sendHLSTimedMetadata(metadataList: sdkTypes.HLSTimedMetadata[]): Promise<void> {
    await this.sdk.sendHLSTimedMetadata(metadataList);
  }
  async changeName(name: string) {
    await this.sdk.changeName(name);
  }

  async changeMetadata(metadata: string | any) {
    if (typeof metadata !== 'string') {
      metadata = JSON.stringify(metadata);
    }
    await this.sdk.changeMetadata(metadata);
  }

  async setSessionMetadata(metadata: any) {
    await this.sdk.setSessionMetadata(metadata);
    this.setState(draftStore => {
      draftStore.sessionMetadata = metadata;
    }, 'setSessionMetadata');
    this.setSessionStoreValueLocally({ key: 'default', value: metadata }, 'setSessionMetadata');
  }

  async populateSessionMetadata(): Promise<void> {
    const metadata = await this.sdk.getSessionMetadata();
    this.setState(draftStore => {
      draftStore.sessionMetadata = metadata;
    }, 'populateSessionMetadata');
    this.setSessionStoreValueLocally({ key: 'default', value: metadata }, 'populateSessionmetadata');
  }

  async setRemoteTrackEnabled(trackID: HMSTrackID | HMSTrackID[], enabled: boolean) {
    if (typeof trackID === 'string') {
      const track = this.hmsSDKTracks[trackID];
      if (track && isRemoteTrack(track)) {
        await this.sdk.changeTrackState(track as SDKHMSRemoteTrack, enabled);
      } else {
        this.logPossibleInconsistency(`No remote track with ID ${trackID} found for change track state`);
      }
    } else if (Array.isArray(trackID)) {
      trackID.forEach(id => this.setRemoteTrackEnabled(id, enabled));
    }
  }

  async setRemoteTracksEnabled(params: HMSChangeMultiTrackStateParams) {
    const sdkRequest: SDKHMSChangeMultiTrackStateParams = {
      enabled: params.enabled,
      type: params.type,
      source: params.source,
    };
    if (params.roles) {
      const rolesMap = this.store.getState(selectRolesMap);
      sdkRequest.roles = params.roles.map(role => rolesMap[role]);
    }
    await this.sdk.changeMultiTrackState(sdkRequest);
  }

  setLogLevel(level: HMSLogLevel) {
    HMSLogger.level = level;
    this.sdk.setLogLevel(level);
  }

  setFrameworkInfo(frameworkInfo: sdkTypes.HMSFrameworkInfo) {
    this.sdk.setFrameworkInfo(frameworkInfo);
  }

  ignoreMessageTypes(msgTypes: string[], replace = false) {
    if (replace) {
      this.ignoredMessageTypes = msgTypes;
    } else {
      for (const msgType of msgTypes) {
        if (!this.ignoredMessageTypes.includes(msgType)) {
          this.ignoredMessageTypes.push(msgType);
        }
      }
    }
  }

  async enableBeamSpeakerLabelsLogging() {
    if (!this.beamSpeakerLabelsLogger) {
      HMSLogger.i('enabling beam speaker labels logging');
      this.beamSpeakerLabelsLogger = new BeamSpeakerLabelsLogger(this.store, this);
      await this.beamSpeakerLabelsLogger.start();
    }
  }

  private resetState(reason = 'resetState') {
    this.isRoomJoinCalled = false;
    this.hmsSDKTracks = {};
    HMSLogger.cleanUp();
    this.setState(store => {
      Object.assign(store, createDefaultStoreState());
    }, reason);
  }

  private async sdkJoinWithListeners(config: sdkTypes.HMSConfig) {
    await this.sdk.join(config, {
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
      onChangeTrackStateRequest: this.onChangeTrackStateRequest.bind(this),
      onChangeMultiTrackStateRequest: this.onChangeMultiTrackStateRequest.bind(this),
      onRemovedFromRoom: this.onRemovedFromRoom.bind(this),
      onNetworkQuality: this.onNetworkQuality.bind(this),
      onSessionStoreUpdate: this.onSessionStoreUpdate.bind(this),
    });
    this.sdk.addAudioListener({
      onAudioLevelUpdate: this.onAudioLevelUpdate.bind(this),
    });
    this.sdk.addConnectionQualityListener({
      onConnectionQualityUpdate: this.onConnectionQualityUpdate.bind(this),
    });
  }

  private onRemovedFromRoom(request: SDKHMSLeaveRoomRequest) {
    const requestedBy = this.store.getState(selectPeerByID(request.requestedBy?.peerId));
    this.hmsNotifications.sendLeaveRoom({
      ...request,
      requestedBy: requestedBy || undefined,
    });
    const action = request.roomEnded || !requestedBy ? 'roomEnded' : 'removedFromRoom';
    HMSLogger.i(`resetting state after peer removed ${action}`, request);
    this.resetState(action);
  }

  private onDeviceChange(event: sdkTypes.HMSDeviceChangeEvent) {
    const devices = event.devices;
    if (!devices) {
      return;
    }
    const localPeer = this.store.getState(selectLocalPeer);
    this.setState(store => {
      if (!areArraysEqual(store.devices.audioInput, devices.audioInput)) {
        store.devices.audioInput = devices.audioInput;
      }
      if (!areArraysEqual(store.devices.videoInput, devices.videoInput)) {
        store.devices.videoInput = devices.videoInput;
      }
      if (!areArraysEqual(store.devices.audioOutput, devices.audioOutput)) {
        store.devices.audioOutput = devices.audioOutput;
      }
      if (localPeer?.id && this.hmsSDKPeers[localPeer.id]) {
        Object.assign(store.settings, this.getMediaSettings(this.hmsSDKPeers[localPeer.id]));
      }
    }, 'deviceChange');
    // send notification only on device change - selection is present
    if (event.selection) {
      const notification = SDKToHMS.convertDeviceChangeUpdate(event);
      this.hmsNotifications.sendDeviceChange(notification);
    }
  }

  private async sdkPreviewWithListeners(config: sdkTypes.HMSPreviewConfig) {
    await this.sdk.preview(config, {
      onPreview: this.onPreview.bind(this),
      onError: this.onError.bind(this),
      onReconnected: this.onReconnected.bind(this),
      onReconnecting: this.onReconnecting.bind(this),
      onDeviceChange: this.onDeviceChange.bind(this),
      onRoomUpdate: this.onRoomUpdate.bind(this),
      onPeerUpdate: this.onPeerUpdate.bind(this),
      onNetworkQuality: this.onNetworkQuality.bind(this),
    });
    this.sdk.addAudioListener({
      onAudioLevelUpdate: this.onAudioLevelUpdate.bind(this),
    });
  }

  private onNetworkQuality(quality: number) {
    this.setState(store => {
      /*
       * if store does not have peerId yet, fetch from sdk directly.
       * sdk will have the localpeer already set.
       */
      const peerId = store.room.localPeer || this.sdk.getLocalPeer()?.peerId;
      if (peerId) {
        store.connectionQualities[peerId] = { peerID: peerId, downlinkQuality: quality };
      }
    }, 'ConnectionQuality');
  }

  private onSessionStoreUpdate(updates: SessionStoreUpdate[]) {
    this.setSessionStoreValueLocally(updates, 'sessionStoreUpdate');
  }

  private async startScreenShare(config?: HMSScreenShareConfig) {
    const isScreenShared = this.store.getState(selectIsLocalScreenShared);
    if (!isScreenShared) {
      await this.sdk.startScreenShare(() => this.syncRoomState('screenshareStopped'), config);
      this.syncRoomState('startScreenShare');
    } else {
      this.logPossibleInconsistency("start screenshare is called while it's on");
    }
  }

  private async stopScreenShare() {
    const isScreenShared = this.store.getState(selectIsLocalScreenShared);
    if (isScreenShared) {
      await this.sdk.stopScreenShare();
      this.syncRoomState('stopScreenShare');
    } else {
      this.logPossibleInconsistency("stop screenshare is called while it's not on");
    }
  }

  private async attachVideoInternal(trackID: string, videoElement: HTMLVideoElement) {
    const sdkTrack = this.hmsSDKTracks[trackID];
    if (sdkTrack && sdkTrack.type === 'video') {
      await this.sdk.attachVideo(sdkTrack as SDKHMSVideoTrack, videoElement);
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
  protected syncRoomState(action: string) {
    action = `${action}_fullSync`;
    HMSLogger.time(`store-sync-${action}`);
    const newHmsPeers: Record<HMSPeerID, Partial<HMSPeer>> = {};
    const newHmsPeerIDs: HMSPeerID[] = []; // to add in room.peers
    const newHmsTracks: Record<HMSTrackID, Partial<HMSTrack>> = {};
    const newHmsSDkTracks: Record<HMSTrackID, SDKHMSTrack> = {};
    const newMediaSettings: Partial<HMSMediaSettings> = {};
    let newPreview: HMSStore['preview'];

    const sdkPeers: sdkTypes.HMSPeer[] = this.sdk.getPeers();

    // first convert everything in the new format
    for (const sdkPeer of sdkPeers) {
      const hmsPeer = SDKToHMS.convertPeer(sdkPeer);
      newHmsPeers[hmsPeer.id] = hmsPeer;
      newHmsPeerIDs.push(hmsPeer.id);
      this.hmsSDKPeers[hmsPeer.id] = sdkPeer;

      const sdkTracks = [sdkPeer.audioTrack, sdkPeer.videoTrack, ...sdkPeer.auxiliaryTracks];
      for (const sdkTrack of sdkTracks) {
        if (!sdkTrack) {
          continue;
        }
        const hmsTrack = SDKToHMS.convertTrack(sdkTrack);
        newHmsTracks[hmsTrack.id] = hmsTrack;
        newHmsSDkTracks[sdkTrack.trackId] = sdkTrack;
      }

      if (sdkPeer.isLocal) {
        const localPeer = sdkPeer as sdkTypes.HMSLocalPeer;
        newPreview = this.getPreviewFields(localPeer);
        Object.assign(newMediaSettings, this.getMediaSettings(localPeer));
      }
    }

    const recording = this.sdk.getRecordingState();
    const rtmp = this.sdk.getRTMPState();
    const hls = this.sdk.getHLSState();

    // then merge them carefully with our store so if something hasn't changed
    // the reference shouldn't change. Note that the draftStore is an immer draft
    // object.
    this.setState(draftStore => {
      draftStore.room.peers = newHmsPeerIDs;
      const draftPeers = draftStore.peers;
      const draftTracks = draftStore.tracks;
      // the order of below statements are important as merge functions are mutating
      mergeNewPeersInDraft(draftPeers, newHmsPeers);
      mergeNewTracksInDraft(draftTracks, newHmsTracks);
      Object.assign(draftStore.settings, newMediaSettings);
      this.hmsSDKTracks = newHmsSDkTracks;

      /**
       * if preview is already present merge,
       * else set as is(which will create/delete)
       */
      if (draftStore.preview?.localPeer && newPreview?.localPeer) {
        Object.assign(draftStore.preview, newPreview);
      } else {
        draftStore.preview = newPreview;
      }
      Object.assign(draftStore.roles, SDKToHMS.convertRoles(this.sdk.getRoles()));
      Object.assign(draftStore.playlist, SDKToHMS.convertPlaylist(this.sdk.getPlaylistManager()));
      Object.assign(draftStore.room, SDKToHMS.convertRecordingStreamingState(recording, rtmp, hls));
      Object.assign(draftStore.templateAppData, this.sdk.getTemplateAppData());
    }, action);
    HMSLogger.timeEnd(`store-sync-${action}`);
  }

  protected onPreview(sdkRoom: sdkTypes.HMSRoom) {
    this.setState(store => {
      Object.assign(store.room, SDKToHMS.convertRoom(sdkRoom));
      store.room.roomState = HMSRoomState.Preview;
    }, 'previewStart');
    this.syncRoomState('previewSync');
  }

  protected onJoin(sdkRoom: sdkTypes.HMSRoom) {
    const playlistManager = this.sdk.getPlaylistManager();
    this.audioPlaylist = new HMSPlaylist(
      playlistManager,
      HMSPlaylistType.audio,
      this.syncPlaylistState.bind(this),
      this.store,
    );
    this.videoPlaylist = new HMSPlaylist(
      playlistManager,
      HMSPlaylistType.video,
      this.syncRoomState.bind(this),
      this.store,
    );
    this.syncRoomState('joinSync');
    this.setState(store => {
      Object.assign(store.room, SDKToHMS.convertRoom(sdkRoom));
      store.room.isConnected = true;
      store.room.roomState = HMSRoomState.Connected;
    }, 'joined');
    playlistManager.onProgress(this.setProgress);
    playlistManager.onNewTrackStart((item: sdkTypes.HMSPlaylistItem<any>) => {
      this.syncPlaylistState(`${item.type}PlaylistUpdate`);
    });
    playlistManager.onPlaylistEnded((type: HMSPlaylistType) => {
      this.syncPlaylistState(`${type}PlaylistEnded`);
    });
    playlistManager.onCurrentTrackEnded((item: sdkTypes.HMSPlaylistItem<any>) => {
      this.hmsNotifications.sendPlaylistTrackEnded(SDKToHMS.convertPlaylistItem(playlistManager, item));
      this.syncPlaylistState(`${item.type}PlaylistItemEnded`);
    });
  }

  protected onRoomUpdate(type: sdkTypes.HMSRoomUpdate, room: sdkTypes.HMSRoom) {
    this.setState(store => {
      Object.assign(store.room, SDKToHMS.convertRoom(room));
    }, type);
  }

  protected onPeerUpdate(type: sdkTypes.HMSPeerUpdate, sdkPeer: sdkTypes.HMSPeer | sdkTypes.HMSPeer[]) {
    if (
      [sdkTypes.HMSPeerUpdate.BECAME_DOMINANT_SPEAKER, sdkTypes.HMSPeerUpdate.RESIGNED_DOMINANT_SPEAKER].includes(type)
    ) {
      return; // ignore, high frequency update so no point of syncing peers
    }
    if (Array.isArray(sdkPeer)) {
      const storePeers = this.store.getState(selectPeersMap);
      const newPeerIds = sdkPeer.filter(peer => !storePeers[peer.peerId]);
      this.syncRoomState('peersJoined');
      const connected = this.store.getState(selectIsConnectedToRoom);
      // This is not send unnecessary notifications while in preview
      // now room state also call peer list to handle large peers
      if (connected) {
        const hmsPeers = [];
        for (const peer of sdkPeer) {
          const hmsPeer = this.store.getState(selectPeerByID(peer.peerId));
          if (hmsPeer) {
            hmsPeers.push(hmsPeer);
          }
        }
        this.hmsNotifications.sendPeerList(hmsPeers);
      } else {
        newPeerIds.forEach(peer => {
          const hmsPeer = this.store.getState(selectPeerByID(peer.peerId));
          if (hmsPeer) {
            this.hmsNotifications.sendPeerUpdate(sdkTypes.HMSPeerUpdate.PEER_JOINED, hmsPeer);
          }
        });
      }
      return;
    }
    this.sendPeerUpdateNotification(type, sdkPeer);
  }

  protected onTrackUpdate(type: sdkTypes.HMSTrackUpdate, track: SDKHMSTrack, peer: sdkTypes.HMSPeer) {
    // this check is needed because for track removed case, the notification needs to
    // be send before the track is removed from store
    if (type === sdkTypes.HMSTrackUpdate.TRACK_REMOVED) {
      this.hmsNotifications.sendTrackUpdate(type, track.trackId);
      this.handleTrackRemove(track, peer);
    } else {
      const actionName = TRACK_NOTIFICATION_TYPES[type] || 'trackUpdate';
      this.syncRoomState(actionName);
      this.hmsNotifications.sendTrackUpdate(type, track.trackId);
    }
  }

  protected onMessageReceived(sdkMessage: sdkTypes.HMSMessage) {
    const hmsMessage = SDKToHMS.convertMessage(sdkMessage) as HMSMessage;
    hmsMessage.read = false;
    hmsMessage.ignored = this.ignoredMessageTypes.includes(hmsMessage.type);
    this.putMessageInStore(hmsMessage);
    this.hmsNotifications.sendMessageReceived(hmsMessage);
  }

  protected putMessageInStore(hmsMessage: HMSMessage) {
    if (hmsMessage.ignored) {
      return;
    }
    this.setState(store => {
      hmsMessage.id = String(this.store.getState(selectHMSMessagesCount) + 1);
      store.messages.byID[hmsMessage.id] = hmsMessage;
      store.messages.allIDs.push(hmsMessage.id);
    }, 'newMessage');
  }

  /*
   * Note: speakers array contain the value only for peers who have audioLevel != 0
   */
  protected onAudioLevelUpdate(sdkSpeakers: sdkTypes.HMSSpeaker[]) {
    this.setState(store => {
      const trackIDAudioLevelMap: Record<HMSPeerID, number> = {};
      sdkSpeakers.forEach(sdkSpeaker => {
        if (!sdkSpeaker.track || !sdkSpeaker.peer) {
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
      for (const [trackID, speaker] of speakerEntries) {
        speaker.audioLevel = trackIDAudioLevelMap[trackID] || 0;
        if (speaker.audioLevel === 0) {
          delete store.speakers[trackID];
        }
      }
    }, 'audioLevel');
  }

  /**
   * The connection quality update is sent for all peers(one needs to know of) every time.
   */
  protected onConnectionQualityUpdate(newQualities: sdkTypes.HMSConnectionQuality[]) {
    this.setState(store => {
      const currentPeerIDs = new Set();
      newQualities.forEach(sdkUpdate => {
        const peerID = sdkUpdate.peerID;
        if (!peerID) {
          return;
        }
        currentPeerIDs.add(peerID);
        if (!store.connectionQualities[peerID]) {
          store.connectionQualities[peerID] = sdkUpdate;
        } else {
          Object.assign(store.connectionQualities[peerID], sdkUpdate);
        }
      });
      const peerIDsStored = Object.keys(store.connectionQualities);
      for (const storedPeerID of peerIDsStored) {
        if (!currentPeerIDs.has(storedPeerID)) {
          // peer is likely no longer there, it wasn't in the update sent by the server
          delete store.connectionQualities[storedPeerID];
        }
      }
    }, 'connectionQuality');
  }

  protected onChangeTrackStateRequest(request: SDKHMSChangeTrackStateRequest) {
    const requestedBy = this.store.getState(selectPeerByID(request.requestedBy?.peerId));
    const storeTrackID = this.getStoreLocalTrackIDfromSDKTrack(request.track);
    const track = this.store.getState(selectTrackByID(storeTrackID));

    if (!track) {
      return this.logPossibleInconsistency(
        `Not found track for which track state change was requested, ${request.track}`,
      );
    }

    if (!request.enabled) {
      this.syncRoomState('changeTrackStateRequest');
    }

    this.hmsNotifications.sendChangeTrackStateRequest({
      requestedBy: requestedBy || undefined,
      track,
      enabled: request.enabled,
    });
  }

  protected onChangeMultiTrackStateRequest(request: SDKHMSChangeMultiTrackStateRequest) {
    const requestedBy = this.store.getState(selectPeerByID(request.requestedBy?.peerId));

    if (!request.enabled) {
      this.syncRoomState('changeMultiTrackStateRequest');
    }

    const tracks: HMSTrack[] = [];
    const tracksMap = this.store.getState(selectTracksMap);
    for (const track of request.tracks) {
      const storeTrackID = this.getStoreLocalTrackIDfromSDKTrack(track);
      if (storeTrackID && tracksMap[storeTrackID]) {
        tracks.push(tracksMap[storeTrackID]);
      }
    }

    this.hmsNotifications.sendChangeMultiTrackStateRequest({
      requestedBy: requestedBy || undefined,
      tracks,
      enabled: request.enabled,
      type: request.type,
      source: request.source,
    });
  }

  protected onReconnected() {
    this.syncRoomState('reconnectedSync');
    this.hmsNotifications.sendReconnected();
    this.setState(store => {
      store.room.roomState = store.room.isConnected ? HMSRoomState.Connected : HMSRoomState.Preview;
    }, 'reconnected');
  }

  protected onReconnecting(sdkError: SDKHMSException) {
    const error = SDKToHMS.convertException(sdkError);
    HMSLogger.e('Reconnection: received error from sdk', error);
    this.hmsNotifications.sendReconnecting(error);
    this.setState(store => {
      store.room.roomState = HMSRoomState.Reconnecting;
      store.errors.push(error);
    }, 'reconnecting');
  }

  protected onError(sdkException: SDKHMSException) {
    const error = SDKToHMS.convertException(sdkException);
    if (error.isTerminal) {
      // terminal error leave room as it is not recoverable
      this.leave().then(() => HMSLogger.e('error from SDK, left room.'));
      this.setState(store => {
        store.room.roomState = HMSRoomState.Failed;
        store.errors.push(error);
      }, 'errorTerminal');
    } else {
      const numExistingErrors = this.store.getState().errors.length;
      // just in case there is some infinite loop sending errors
      if (numExistingErrors < 50) {
        this.setState(store => {
          store.errors.push(error);
        }, 'error');
      }
    }
    this.syncRoomState('errorSync'); //TODO: check if need to be done in a different way
    // send notification
    this.hmsNotifications.sendError(error);
    HMSLogger.e('received error from sdk', error instanceof SDKHMSException ? `${error}` : error);
  }

  private handleTrackRemove(sdkTrack: SDKHMSTrack, sdkPeer: sdkTypes.HMSPeer) {
    this.setState(draftStore => {
      const hmsPeer = draftStore.peers[sdkPeer.peerId];
      const draftTracks = draftStore.tracks;
      const trackId = sdkTrack.trackId;
      // find and remove the exact track from hmsPeer
      if (this.isSameStoreSDKTrack(trackId, hmsPeer?.audioTrack)) {
        delete hmsPeer?.audioTrack;
      } else if (this.isSameStoreSDKTrack(trackId, hmsPeer?.videoTrack)) {
        delete hmsPeer?.videoTrack;
      } else {
        const auxiliaryIndex = hmsPeer?.auxiliaryTracks.indexOf(trackId);
        if (auxiliaryIndex > -1 && this.isSameStoreSDKTrack(trackId, hmsPeer?.auxiliaryTracks[auxiliaryIndex])) {
          hmsPeer?.auxiliaryTracks.splice(auxiliaryIndex, 1);
        }
      }
      delete draftTracks[trackId];
      delete this.hmsSDKTracks[trackId];
    }, 'trackRemoved');
  }

  private async setEnabledSDKTrack(trackID: string, enabled: boolean) {
    const track = this.hmsSDKTracks[trackID];
    if (track) {
      await track.setEnabled(enabled);
    } else {
      this.logPossibleInconsistency(`track ${trackID} not present, unable to enabled/disable`);
    }
  }

  private async setSDKLocalVideoTrackSettings(trackID: string, settings: Partial<sdkTypes.HMSVideoTrackSettings>) {
    const track = this.hmsSDKTracks[trackID] as SDKHMSLocalVideoTrack;
    if (track) {
      await track.setSettings(settings);
    } else {
      this.logPossibleInconsistency(`local track ${trackID} not present, unable to set settings`);
    }
  }

  private async setSDKLocalAudioTrackSettings(trackID: string, settings: Partial<sdkTypes.HMSAudioTrackSettings>) {
    const track = this.hmsSDKTracks[trackID] as SDKHMSLocalAudioTrack;
    if (track) {
      await track.setSettings(settings);
    } else {
      this.logPossibleInconsistency(`local track ${trackID} not present, unable to set settings`);
    }
  }

  private getMediaSettings(sdkPeer: sdkTypes.HMSPeer): Partial<HMSMediaSettings> {
    const settings = this.store.getState(selectLocalMediaSettings);
    const audioTrack = sdkPeer.audioTrack as SDKHMSLocalAudioTrack;
    const videoTrack = sdkPeer.videoTrack as SDKHMSLocalVideoTrack;
    return {
      audioInputDeviceId: audioTrack?.settings.deviceId || settings.audioInputDeviceId,
      videoInputDeviceId: videoTrack?.settings.deviceId || settings.videoInputDeviceId,
      audioOutputDeviceId: this.sdk.getAudioOutput().getDevice()?.deviceId,
    };
  }

  private getPreviewFields(sdkLocalPeer: sdkTypes.HMSLocalPeer): HMSStore['preview'] {
    // if room is not in preview, clear preview fields
    if (!sdkLocalPeer.isInPreview()) {
      return;
    }

    const hmsLocalPeer = SDKToHMS.convertPeer(sdkLocalPeer);

    return {
      localPeer: hmsLocalPeer.id,
      audioTrack: hmsLocalPeer.audioTrack,
      videoTrack: hmsLocalPeer.videoTrack,
      asRole: sdkLocalPeer.asRole?.name || sdkLocalPeer.role?.name,
    };
  }

  private async setTrackVolume(value: number, trackId: HMSTrackID) {
    const track = this.hmsSDKTracks[trackId];
    if (track) {
      if (track instanceof SDKHMSAudioTrack) {
        await track.setVolume(value);
        this.setState(draftStore => {
          const track = draftStore.tracks[trackId];
          if (track && track.type === 'audio') {
            track.volume = value;
          }
        }, 'trackVolume');
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
    if (localPeer?.videoTrack !== trackID) {
      return false;
    }
    const displayEnabled = this.store.getState(selectIsLocalVideoDisplayEnabled);
    const actuallyEnabled = this.store.getState(selectIsLocalVideoEnabled);
    return displayEnabled && !actuallyEnabled;
  }

  private logPossibleInconsistency(inconsistency: string) {
    HMSLogger.w('possible inconsistency detected - ', inconsistency);
  }

  private async addRemoveVideoPlugin(plugin: HMSVideoPlugin, action: 'add' | 'remove', pluginFrameRate?: number) {
    if (!plugin) {
      HMSLogger.w('Invalid plugin received in store');
      return;
    }
    const trackID = this.store.getState(selectLocalVideoTrackID);
    if (trackID) {
      const sdkTrack = this.hmsSDKTracks[trackID];
      if (sdkTrack) {
        if (action === 'add') {
          await (sdkTrack as SDKHMSLocalVideoTrack).addPlugin(plugin, pluginFrameRate);
        } else if (action === 'remove') {
          await (sdkTrack as SDKHMSLocalVideoTrack).removePlugin(plugin);
        }
        this.syncRoomState(`${action}VideoPlugin`);
      } else {
        this.logPossibleInconsistency(`track ${trackID} not present, unable to remove plugin`);
      }
    }
  }
  private async addRemoveAudioPlugin(plugin: HMSAudioPlugin, action: 'add' | 'remove') {
    if (!plugin) {
      HMSLogger.w('Invalid plugin received in store');
      return;
    }
    const trackID = this.store.getState(selectLocalAudioTrackID);
    if (trackID) {
      const sdkTrack = this.hmsSDKTracks[trackID];
      if (sdkTrack) {
        if (action === 'add') {
          await (sdkTrack as SDKHMSLocalAudioTrack).addPlugin(plugin);
        } else if (action === 'remove') {
          await (sdkTrack as SDKHMSLocalAudioTrack).removePlugin(plugin);
        }
        this.syncRoomState(`${action}AudioPlugin`);
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
    this.setState(store => {
      if (store.roleChangeRequests.length === 0) {
        store.roleChangeRequests.push(SDKToHMS.convertRoleChangeRequest(request));
      }
    }, 'roleChangeRequest');
  }

  private removeRoleChangeRequest(toRemove: HMSRoleChangeRequest) {
    this.setState(store => {
      const index = store.roleChangeRequests.findIndex(req => {
        return req.token === toRemove.token;
      });
      if (index !== -1) {
        store.roleChangeRequests.splice(index, 1);
      }
    }, 'removeRoleChangeRequest');
  }

  private onRoleUpdate() {
    this.syncRoomState('roleUpdate');
  }

  private getStoreLocalTrackIDfromSDKTrack(sdkTrack: SDKHMSLocalTrack) {
    const trackIDs = this.store.getState(selectLocalTrackIDs);
    return trackIDs.find(trackID => this.hmsSDKTracks[trackID].trackId === sdkTrack.trackId);
  }

  private setProgress = ({ type, progress }: sdkTypes.HMSPlaylistProgressEvent) => {
    this.setState(draftStore => {
      draftStore.playlist[type].progress = progress;
      draftStore.playlist[type].currentTime = this.sdk.getPlaylistManager().getCurrentTime(type);
    }, 'playlistProgress');
  };

  private syncPlaylistState = (action: string) => {
    this.setState(draftStore => {
      Object.assign(draftStore.playlist, SDKToHMS.convertPlaylist(this.sdk.getPlaylistManager()));
    }, action);
  };

  private sendPeerUpdateNotification = (type: sdkTypes.HMSPeerUpdate, sdkPeer: sdkTypes.HMSPeer) => {
    let peer = this.store.getState(selectPeerByID(sdkPeer.peerId));
    const actionName = PEER_NOTIFICATION_TYPES[type] || 'peerUpdate';
    this.syncRoomState(actionName);
    // if peer wasn't available before sync(will happen if event is peer join)
    if (!peer) {
      peer = this.store.getState(selectPeerByID(sdkPeer.peerId));
    }
    this.hmsNotifications.sendPeerUpdate(type, peer);
  };

  private setSessionStoreValueLocally(
    updates: SessionStoreUpdate | SessionStoreUpdate[],
    actionName = 'setSessionStore',
  ) {
    const updatesList: SessionStoreUpdate[] = Array.isArray(updates) ? updates : [updates];
    this.setState(store => {
      updatesList.forEach(update => {
        store.sessionStore[update.key as keyof T['sessionStore']] = update.value;
      });
    }, actionName);
  }

  /**
   * setState is separate so any future changes to how state change can be done from one place.
   * @param fn
   * @param name
   */
  private setState: NamedSetState<HMSStore<T>> = (fn, name) => {
    return this.store.namedSetState(fn, name);
  };
}
