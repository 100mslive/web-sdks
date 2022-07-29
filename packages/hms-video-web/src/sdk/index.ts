import {
  HMSChangeMultiTrackStateParams,
  HMSConfig,
  HMSConnectionQualityListener,
  HMSDeviceChangeEvent,
  HMSMessageInput,
  HMSPlaylistType,
  HMSRole,
  HMSRoleChangeRequest,
  HMSVideoCodec,
  ScreenShareConfig,
} from '../interfaces';
import InitialSettings from '../interfaces/settings';
import HMSInterface from '../interfaces/hms';
import HMSTransport from '../transport';
import ITransportObserver from '../transport/ITransportObserver';
import { HMSAudioListener, HMSTrackUpdate, HMSUpdateListener } from '../interfaces/update-listener';
import HMSLogger, { HMSLogLevel } from '../utils/logger';
import decodeJWT from '../utils/jwt';
import { HMSNotificationMethod, NotificationManager, PeerLeaveRequestNotification } from '../notification-manager';
import {
  HMSLocalAudioTrack,
  HMSLocalTrack,
  HMSLocalVideoTrack,
  HMSRemoteTrack,
  HMSRemoteVideoTrack,
  HMSTrackSource,
  HMSTrackType,
} from '../media/tracks';
import { HMSException } from '../error/HMSException';
import HMSRoom from './models/HMSRoom';
import { HMSLocalPeer, HMSPeer, HMSRemotePeer } from './models/peer';
import Message from './models/HMSMessage';
import HMSLocalStream from '../media/streams/HMSLocalStream';
import { HMSAudioTrackSettingsBuilder, HMSVideoTrackSettingsBuilder } from '../media/settings';
import { AudioSinkManager } from '../audio-sink-manager';
import { AudioOutputManager, DeviceManager } from '../device-manager';
import { HMSAnalyticsLevel } from '../analytics/AnalyticsEventLevel';
import { AnalyticsEventsService } from '../analytics/AnalyticsEventsService';
import { TransportState } from '../transport/models/TransportState';
import { ErrorFactory, HMSAction } from '../error/ErrorFactory';
import { ErrorCodes } from '../error/ErrorCodes';
import { HMSPreviewListener } from '../interfaces/preview-listener';
import { IErrorListener } from '../interfaces/error-listener';
import { IStore, Store } from './store';
import { DeviceChangeListener } from '../interfaces/device-change-listener';
import RoleChangeManager from './RoleChangeManager';
import { HMSLeaveRoomRequest } from '../interfaces/leave-room-request';
import { DeviceStorageManager } from '../device-manager/DeviceStorage';
import { LocalTrackManager } from './LocalTrackManager';
import { PlaylistManager } from '../playlist-manager';
import { RTMPRecordingConfig } from '../interfaces/rtmp-recording-config';
import { isNode } from '../utils/support';
import { EventBus } from '../events/EventBus';
import { HLSConfig, HLSTimedMetadata } from '../interfaces/hls-config';
import { validateMediaDevicesExistence, validateRTCPeerConnection } from '../utils/validations';
import AnalyticsEventFactory from '../analytics/AnalyticsEventFactory';
import AnalyticsEvent from '../analytics/AnalyticsEvent';
import { InitConfig } from '../signal/init/models';
import { NetworkTestManager } from './NetworkTestManager';
import { HMSAudioContextHandler } from '../utils/media';
import { AnalyticsTimer, TimedEvent } from '../analytics/AnalyticsTimer';

// @DISCUSS: Adding it here as a hotfix
const defaultSettings = {
  isAudioMuted: false,
  isVideoMuted: false,
  audioInputDeviceId: 'default',
  audioOutputDeviceId: 'default',
  videoDeviceId: 'default',
};

const INITIAL_STATE = {
  published: false,
  isInitialised: false,
  isReconnecting: false,
  isPreviewInProgress: false,
  deviceManagersInitialised: false,
};

export class HMSSdk implements HMSInterface {
  private transport!: HMSTransport;
  private TAG = '[HMSSdk]:';
  private listener?: HMSUpdateListener;
  private errorListener?: IErrorListener;
  private deviceChangeListener?: DeviceChangeListener;
  private audioListener?: HMSAudioListener;
  private store!: IStore;
  private notificationManager!: NotificationManager;
  private deviceManager!: DeviceManager;
  private audioSinkManager!: AudioSinkManager;
  private playlistManager!: PlaylistManager;
  private audioOutput!: AudioOutputManager;
  private transportState: TransportState = TransportState.Disconnected;
  private roleChangeManager?: RoleChangeManager;
  private localTrackManager!: LocalTrackManager;
  private analyticsEventsService!: AnalyticsEventsService;
  private analyticsTimer = new AnalyticsTimer();
  private eventBus!: EventBus;
  private networkTestManager!: NetworkTestManager;
  private sdkState = { ...INITIAL_STATE };

  private initStoreAndManagers() {
    if (this.sdkState.isInitialised) {
      /**
       * Set listener after both join and preview, since they can have different listeners
       */
      this.notificationManager.setListener(this.listener);
      this.audioSinkManager.setListener(this.listener);
      return;
    }

    this.sdkState.isInitialised = true;
    this.store = new Store();
    this.eventBus = new EventBus();
    this.networkTestManager = new NetworkTestManager(this.eventBus, this.listener);
    this.playlistManager = new PlaylistManager(this, this.eventBus);
    this.notificationManager = new NotificationManager(this.store, this.eventBus, this.listener, this.audioListener);
    this.deviceManager = new DeviceManager(this.store, this.eventBus);
    this.audioSinkManager = new AudioSinkManager(this.store, this.deviceManager, this.eventBus);
    this.audioOutput = new AudioOutputManager(this.deviceManager, this.audioSinkManager);
    this.audioSinkManager.setListener(this.listener);
    this.eventBus.autoplayError.subscribe(this.handleAutoplayError);
    this.localTrackManager = new LocalTrackManager(
      this.store,
      this.observer,
      this.deviceManager,
      this.eventBus,
      this.analyticsTimer,
    );
    this.analyticsEventsService = new AnalyticsEventsService(this.store);
    this.transport = new HMSTransport(
      this.observer,
      this.deviceManager,
      this.store,
      this.localTrackManager,
      this.eventBus,
      this.analyticsEventsService,
      this.analyticsTimer,
    );

    /**
     * Note: Subscribe to events here right after creating stores and managers
     * to not miss events that are published before the handlers are subscribed.
     */
    this.eventBus.analytics.subscribe(this.sendAnalyticsEvent);
    this.eventBus.deviceChange.subscribe(this.handleDeviceChange);
    this.eventBus.audioPluginFailed.subscribe(this.handleAudioPluginError);
  }

  private validateJoined(name: string) {
    if (!this.localPeer) {
      throw ErrorFactory.GenericErrors.NotConnected(HMSAction.VALIDATION, `Not connected - ${name}`);
    }
  }

  async refreshDevices() {
    this.validateJoined('refreshDevices');
    await this.deviceManager.init(true);
  }

  getWebrtcInternals() {
    return this.transport?.getWebrtcInternals();
  }

  getPlaylistManager(): PlaylistManager {
    return this.playlistManager;
  }

  getRecordingState() {
    return this.store.getRoom()?.recording;
  }

  getRTMPState() {
    return this.store.getRoom()?.rtmp;
  }

  getHLSState() {
    return this.store.getRoom()?.hls;
  }

  private handleAutoplayError = (error: HMSException) => {
    this.errorListener?.onError?.(error);
  };

  private get localPeer(): HMSLocalPeer | undefined {
    return this.store?.getLocalPeer();
  }

  private observer: ITransportObserver = {
    onNotification: (message: any) => {
      if (message.method === HMSNotificationMethod.PEER_LEAVE_REQUEST) {
        this.handlePeerLeaveRequest(message.params as PeerLeaveRequestNotification);
        return;
      }

      if (message.method === HMSNotificationMethod.POLICY_CHANGE) {
        this.analyticsTimer.end(TimedEvent.ON_POLICY_CHANGE);
      }

      this.notificationManager.handleNotification(message, this.sdkState.isReconnecting);
    },

    onTrackAdd: (track: HMSRemoteTrack) => {
      this.notificationManager.handleTrackAdd(track);
    },

    onTrackRemove: (track: HMSRemoteTrack) => {
      this.notificationManager.handleTrackRemove(track);
    },

    onTrackDegrade: (track: HMSRemoteVideoTrack) => {
      HMSLogger.d(this.TAG, 'Sending Track Update Track Degraded', track);
      this.listener?.onTrackUpdate(HMSTrackUpdate.TRACK_DEGRADED, track, this.store?.getPeerByTrackId(track.trackId)!);
    },

    onTrackRestore: (track: HMSRemoteVideoTrack) => {
      HMSLogger.d(this.TAG, 'Sending Track Update Track Restored', track);
      this.listener?.onTrackUpdate(HMSTrackUpdate.TRACK_RESTORED, track, this.store?.getPeerByTrackId(track.trackId)!);
    },

    onFailure: (exception: HMSException) => {
      this.errorListener?.onError(exception);
    },

    onStateChange: async (state: TransportState, error?: HMSException) => {
      switch (state) {
        case TransportState.Preview:
        case TransportState.Joined:
          if (this.transportState === TransportState.Reconnecting) {
            this.listener?.onReconnected();
          }
          break;
        case TransportState.Failed:
          await this.leave();

          this.errorListener?.onError?.(error!);
          this.sdkState.isReconnecting = false;
          break;
        case TransportState.Reconnecting:
          this.sdkState.isReconnecting = true;
          this.listener?.onReconnecting(error!);
          break;
      }

      this.transportState = state;
      HMSLogger.d(this.TAG, 'Transport State Change', this.transportState);
    },
  };

  private handlePeerLeaveRequest = (message: PeerLeaveRequestNotification) => {
    const peer = message.requested_by ? this.store.getPeerById(message.requested_by) : undefined;
    const request: HMSLeaveRoomRequest = {
      roomEnded: message.room_end,
      reason: message.reason,
      requestedBy: peer,
    };
    this.listener?.onRemovedFromRoom(request);
    this.leave();
  };

  async preview(config: HMSConfig, listener: HMSPreviewListener) {
    validateMediaDevicesExistence();
    validateRTCPeerConnection();

    if (this.sdkState.isPreviewInProgress) {
      return Promise.reject(
        ErrorFactory.GenericErrors.PreviewAlreadyInProgress(HMSAction.PREVIEW, 'Preview already called'),
      );
    }

    this.analyticsTimer.start(TimedEvent.PREVIEW);
    this.setUpPreview(config, listener);

    // Request permissions and populate devices before waiting for policy
    if (config.alwaysRequestPermissions) {
      this.localTrackManager.requestPermissions().then(async () => {
        await this.initDeviceManagers();
      });
    }

    let initSuccessful = false;
    let networkTestFinished = false;
    const timerId = setTimeout(() => {
      // If init or network is not done by 3s send -1
      if (!initSuccessful || !networkTestFinished) {
        this.listener?.onNetworkQuality?.(-1);
      }
    }, 3000);
    return new Promise<void>((resolve, reject) => {
      const policyHandler = async () => {
        const tracks = await this.localTrackManager.getTracksToPublish(config.settings || defaultSettings);
        tracks.forEach(track => this.setLocalPeerTrack(track));
        this.localPeer?.audioTrack && this.initPreviewTrackAudioLevelMonitor();
        await this.initDeviceManagers();
        this.sdkState.isPreviewInProgress = false;
        this.analyticsTimer.end(TimedEvent.PREVIEW);
        listener.onPreview(this.store.getRoom(), tracks);
        this.sendPreviewAnalyticsEvent();
        resolve();
      };

      this.eventBus.policyChange.subscribeOnce(policyHandler);
      this.transport
        .preview(
          config.authToken,
          config.initEndpoint!,
          this.localPeer!.peerId,
          { name: config.userName, metaData: config.metaData || '' },
          config.autoVideoSubscribe,
        )
        .then((initConfig: InitConfig | void) => {
          initSuccessful = true;
          clearTimeout(timerId);
          if (initConfig && config.captureNetworkQualityInPreview) {
            this.networkTestManager.start(initConfig.config?.networkHealth).then(() => {
              networkTestFinished = true;
            });
          }
        })
        .catch(ex => {
          this.analyticsTimer.end(TimedEvent.PREVIEW);
          this.errorListener?.onError(ex as HMSException);
          this.sendPreviewAnalyticsEvent(ex);
          this.sdkState.isPreviewInProgress = false;
          reject(ex as HMSException);
        });
    });
  }

  private handleDeviceChange = (event: HMSDeviceChangeEvent) => {
    HMSLogger.d(this.TAG, 'Device Change event', event);
    this.deviceChangeListener?.onDeviceChange?.(event);
    if (event.error && event.type) {
      const track = event.type.includes('audio') ? this.localPeer?.audioTrack : this.localPeer?.videoTrack;
      this.errorListener?.onError(event.error);
      if (
        [
          ErrorCodes.TracksErrors.CANT_ACCESS_CAPTURE_DEVICE,
          ErrorCodes.TracksErrors.DEVICE_IN_USE,
          ErrorCodes.TracksErrors.DEVICE_NOT_AVAILABLE,
        ].includes(event.error.code) &&
        track
      ) {
        track.setEnabled(false);
        this.listener?.onTrackUpdate(HMSTrackUpdate.TRACK_MUTED, track, this.localPeer!);
      }
    }
  };

  private handleAudioPluginError = (error: HMSException) => {
    HMSLogger.e(this.TAG, 'Audio Plugin Error event', error);
    this.errorListener?.onError(error);
  };

  join(config: HMSConfig, listener: HMSUpdateListener) {
    validateMediaDevicesExistence();
    validateRTCPeerConnection();

    if (this.sdkState.isPreviewInProgress) {
      throw ErrorFactory.GenericErrors.NotReady(HMSAction.JOIN, "Preview is in progress, can't join");
    }

    this.analyticsTimer.start(TimedEvent.JOIN);

    const isPreviewCalled = this.transportState === TransportState.Preview;
    const { roomId, userId, role } = decodeJWT(config.authToken);
    this.networkTestManager?.stop();
    this.localPeer?.audioTrack?.destroyAudioLevelMonitor();
    this.listener = listener;
    this.commonSetup(config, roomId, listener);
    this.removeDevicesFromConfig(config);
    this.store.setConfig(config);

    if (!this.localPeer) {
      this.createAndAddLocalPeerToStore(config, role, userId);
    } else {
      this.localPeer.name = config.userName;
      this.localPeer.role = this.store.getPolicyForRole(role);
      this.localPeer.customerUserId = userId;
      this.localPeer.metadata = config.metaData || '';
    }

    this.roleChangeManager = new RoleChangeManager(
      this.store,
      this.transport,
      this.publish.bind(this),
      this.removeTrack.bind(this),
      this.listener,
    );
    this.eventBus.localRoleUpdate.subscribe(this.handleLocalRoleUpdate);

    HMSLogger.d(this.TAG, 'SDK Store', this.store);
    HMSLogger.d(this.TAG, `⏳ Joining room ${roomId}`);

    HMSLogger.time(`join-room-${roomId}`);
    this.transport
      .join(
        config.authToken,
        this.localPeer!.peerId,
        { name: config.userName, metaData: config.metaData || '' },
        config.initEndpoint!,
        config.autoVideoSubscribe,
      )
      .then(async () => {
        HMSLogger.d(this.TAG, `✅ Joined room ${roomId}`);
        HMSAudioContextHandler.resumeContext();
        this.notifyJoin();
        this.sendJoinAnalyticsEvent(isPreviewCalled);
        if (this.store.getPublishParams() && !this.sdkState.published && !isNode) {
          await this.publish(config.settings || defaultSettings);
        }
      })
      .catch(error => {
        this.analyticsTimer.end(TimedEvent.JOIN);
        this.listener?.onError(error as HMSException);
        this.sendJoinAnalyticsEvent(isPreviewCalled, error);
        HMSLogger.e(this.TAG, 'Unable to join room', error);
      })
      .then(() => {
        HMSLogger.timeEnd(`join-room-${roomId}`);
      });
  }

  private stringifyMetadata(config: HMSConfig) {
    if (config.metaData && typeof config.metaData !== 'string') {
      JSON.stringify(config.metaData);
    }
  }

  private cleanUp() {
    this.cleanDeviceManagers();
    this.eventBus.analytics.unsubscribe(this.sendAnalyticsEvent);
    this.analyticsTimer.cleanUp();
    DeviceStorageManager.cleanup();
    this.playlistManager.cleanup();
    HMSLogger.cleanUp();
    this.sdkState = { ...INITIAL_STATE };
    /**
     * when leave is called after preview itself without join.
     * Store won't have the tracks in this case
     */
    if (this.localPeer) {
      this.localPeer.audioTrack?.cleanup();
      this.localPeer.audioTrack = undefined;
      this.localPeer.videoTrack?.cleanup();
      this.localPeer.videoTrack = undefined;
    }
    this.store.cleanUp();
    this.listener = undefined;
    if (this.roleChangeManager) {
      this.eventBus.localRoleUpdate.unsubscribe(this.roleChangeManager.handleLocalPeerRoleUpdate);
    }
  }

  async leave() {
    const room = this.store.getRoom();
    if (room) {
      const roomId = room.id;
      this.networkTestManager?.stop();
      HMSLogger.d(this.TAG, `⏳ Leaving room ${roomId}`);
      // browsers often put limitation on amount of time a function set on window onBeforeUnload can take in case of
      // tab refresh or close. Therefore prioritise the leave action over anything else, if tab is closed/refreshed
      // we would want leave to succeed to stop stucked peer for others. The followup cleanup however is important
      // for cases where uses stays on the page post leave.
      await this.transport?.leave();
      this.cleanUp();
      HMSLogger.d(this.TAG, `✅ Left room ${roomId}`);
    }
  }

  getLocalPeer() {
    return this.store.getLocalPeer();
  }

  getPeers() {
    const peers = this.store.getPeers();
    if (peers.length < 50) {
      // the log is too big and frequent for large rooms
      HMSLogger.d(this.TAG, `Got peers`, peers);
    }
    return peers;
  }

  getAudioOutput() {
    return this.audioOutput;
  }

  sendMessage(type: string, message: string) {
    this.sendMessageInternal({ message, type });
  }

  async sendBroadcastMessage(message: string, type?: string) {
    return await this.sendMessageInternal({ message, type });
  }

  async sendGroupMessage(message: string, roles: HMSRole[], type?: string) {
    const knownRoles = this.store.getKnownRoles();
    const recipientRoles =
      roles.filter(role => {
        return knownRoles[role.name];
      }) || [];
    if (recipientRoles.length === 0) {
      throw ErrorFactory.GenericErrors.ValidationFailed('No valid role is present', roles);
    }
    return await this.sendMessageInternal({ message, recipientRoles: roles, type });
  }

  async sendDirectMessage(message: string, peer: HMSPeer, type?: string) {
    const recipientPeer = this.store.getPeerById(peer.peerId);
    if (!recipientPeer) {
      throw ErrorFactory.GenericErrors.ValidationFailed('Invalid peer - peer not present in the room', peer);
    }
    if (this.localPeer?.peerId === peer.peerId) {
      throw ErrorFactory.GenericErrors.ValidationFailed('Cannot send message to self');
    }
    return await this.sendMessageInternal({ message, recipientPeer: peer, type });
  }

  private async sendMessageInternal({ recipientRoles, recipientPeer, type = 'chat', message }: HMSMessageInput) {
    if (message.replace(/\u200b/g, ' ').trim() === '') {
      HMSLogger.w(this.TAG, 'sendMessage', 'Ignoring empty message send');
      throw ErrorFactory.GenericErrors.ValidationFailed('Empty message not allowed');
    }
    const hmsMessage = new Message({
      sender: this.localPeer!,
      type,
      message,
      recipientPeer,
      recipientRoles,
      time: new Date(),
    });
    HMSLogger.d(this.TAG, 'Sending Message: ', hmsMessage);
    const response = await this.transport.sendMessage(hmsMessage);
    hmsMessage.time = new Date(response.timestamp);
    return hmsMessage;
  }

  async startScreenShare(onStop: () => void, config: ScreenShareConfig = { audioOnly: false, videoOnly: false }) {
    const publishParams = this.store.getPublishParams();
    if (!publishParams) {
      return;
    }

    const { allowed } = publishParams;
    const canPublishScreen = allowed && allowed.includes('screen');

    if (!canPublishScreen) {
      HMSLogger.e(this.TAG, `Role ${this.localPeer?.role} cannot share screen`);
      return;
    }

    if (this.localPeer?.auxiliaryTracks?.find(track => track.source === 'screen')) {
      throw Error('Cannot share multiple screens');
    }

    const tracks = await this.getScreenshareTracks(onStop, config);
    if (!this.localPeer) {
      HMSLogger.d(this.TAG, 'Screenshared when not connected');
      tracks.forEach(track => {
        track.cleanup();
      });
      return;
    }
    await this.transport.publish(tracks);
    tracks.forEach(track => {
      track.peerId = this.localPeer?.peerId;
      this.localPeer?.auxiliaryTracks.push(track);
      this.listener?.onTrackUpdate(HMSTrackUpdate.TRACK_ADDED, track, this.localPeer!);
    });
  }

  private async stopEndedScreenshare(onStop: () => void) {
    HMSLogger.d(this.TAG, `✅ Screenshare ended natively`);
    await this.stopScreenShare();
    onStop();
  }

  async stopScreenShare() {
    HMSLogger.d(this.TAG, `✅ Screenshare ended from app`);
    const screenTracks = this.localPeer?.auxiliaryTracks.filter(t => t.source === 'screen');
    if (screenTracks) {
      for (const track of screenTracks) {
        await this.removeTrack(track.trackId);
      }
    }
  }

  async addTrack(track: MediaStreamTrack, source: HMSTrackSource = 'regular'): Promise<void> {
    if (!track) {
      HMSLogger.w(this.TAG, 'Please pass a valid MediaStreamTrack');
      return;
    }
    if (!this.localPeer) {
      throw ErrorFactory.GenericErrors.NotConnected(HMSAction.VALIDATION, 'No local peer present, cannot addTrack');
    }
    const isTrackPresent = this.localPeer.auxiliaryTracks.find(t => t.trackId === track.id);
    if (isTrackPresent) {
      return;
    }

    const type = track.kind;
    const nativeStream = new MediaStream([track]);
    const stream = new HMSLocalStream(nativeStream);

    const TrackKlass = type === 'audio' ? HMSLocalAudioTrack : HMSLocalVideoTrack;
    const hmsTrack = new TrackKlass(stream, track, source, this.eventBus);
    this.setPlaylistSettings({
      track,
      hmsTrack,
      source,
    });

    await this.transport?.publish([hmsTrack]);
    hmsTrack.peerId = this.localPeer?.peerId;
    this.localPeer?.auxiliaryTracks.push(hmsTrack);
    this.listener?.onTrackUpdate(HMSTrackUpdate.TRACK_ADDED, hmsTrack, this.localPeer!);
  }

  async removeTrack(trackId: string) {
    if (!this.localPeer) {
      throw ErrorFactory.GenericErrors.NotConnected(HMSAction.VALIDATION, 'No local peer present, cannot removeTrack');
    }
    const trackIndex = this.localPeer.auxiliaryTracks.findIndex(t => t.trackId === trackId);
    if (trackIndex > -1) {
      const track = this.localPeer.auxiliaryTracks[trackIndex];
      await this.transport!.unpublish([track]);
      // Stop local playback when playlist track is removed
      if (track.source === 'audioplaylist') {
        this.playlistManager.stop(HMSPlaylistType.audio);
      } else if (track.source === 'videoplaylist') {
        this.playlistManager.stop(HMSPlaylistType.video);
      }
      this.localPeer.auxiliaryTracks.splice(trackIndex, 1);
      this.listener?.onTrackUpdate(HMSTrackUpdate.TRACK_REMOVED, track, this.localPeer);
    } else {
      HMSLogger.w(this.TAG, `No track found for ${trackId}`);
    }
  }

  setAnalyticsLevel(level: HMSAnalyticsLevel) {
    this.analyticsEventsService.level = level;
  }

  setLogLevel(level: HMSLogLevel) {
    HMSLogger.level = level;
  }

  addAudioListener(audioListener: HMSAudioListener) {
    this.audioListener = audioListener;
    this.notificationManager.setAudioListener(audioListener);
  }

  addConnectionQualityListener(qualityListener: HMSConnectionQualityListener) {
    this.notificationManager.setConnectionQualityListener(qualityListener);
  }

  async changeRole(forPeer: HMSPeer, toRole: string, force = false) {
    if (!forPeer.role || forPeer.role.name === toRole) {
      return;
    }

    await this.transport?.changeRole(forPeer, toRole, force);
  }

  async acceptChangeRole(request: HMSRoleChangeRequest) {
    await this.transport?.acceptRoleChange(request);
  }

  async endRoom(lock: boolean, reason: string) {
    if (!this.localPeer) {
      throw ErrorFactory.GenericErrors.NotConnected(HMSAction.VALIDATION, 'No local peer present, cannot end room');
    }
    await this.transport?.endRoom(lock, reason);
    await this.leave();
  }

  async removePeer(peer: HMSRemotePeer, reason: string) {
    if (!this.localPeer) {
      throw ErrorFactory.GenericErrors.NotConnected(HMSAction.VALIDATION, 'No local peer present, cannot remove peer');
    }

    if (!this.store.getPeerById(peer.peerId)) {
      throw ErrorFactory.GenericErrors.ValidationFailed('Invalid peer, given peer not present in room', peer);
    }
    await this.transport?.removePeer(peer.peerId, reason);
  }

  async startRTMPOrRecording(params: RTMPRecordingConfig) {
    if (!this.localPeer) {
      throw ErrorFactory.GenericErrors.NotConnected(
        HMSAction.VALIDATION,
        'No local peer present, cannot start streaming or recording',
      );
    }
    try {
      await this.transport?.startRTMPOrRecording(params);
    } catch (error) {
      this.sendAnalyticsEvent(AnalyticsEventFactory.RTMPError(error as Error));
      throw error;
    }
  }

  async stopRTMPAndRecording() {
    if (!this.localPeer) {
      throw ErrorFactory.GenericErrors.NotConnected(
        HMSAction.VALIDATION,
        'No local peer present, cannot stop streaming or recording',
      );
    }
    try {
      await this.transport?.stopRTMPOrRecording();
    } catch (error) {
      this.sendAnalyticsEvent(AnalyticsEventFactory.RTMPError(error as Error, false));
      throw error;
    }
  }

  async startHLSStreaming(params?: HLSConfig) {
    if (!this.localPeer) {
      throw ErrorFactory.GenericErrors.NotConnected(
        HMSAction.VALIDATION,
        'No local peer present, cannot start HLS streaming',
      );
    }
    try {
      await this.transport?.startHLSStreaming(params);
    } catch (error) {
      this.sendAnalyticsEvent(AnalyticsEventFactory.HLSError(error as Error));
      throw error;
    }
  }

  async stopHLSStreaming(params?: HLSConfig) {
    if (!this.localPeer) {
      throw ErrorFactory.GenericErrors.NotConnected(
        HMSAction.VALIDATION,
        'No local peer present, cannot stop HLS streaming',
      );
    }
    try {
      await this.transport?.stopHLSStreaming(params);
    } catch (error) {
      this.sendAnalyticsEvent(AnalyticsEventFactory.HLSError(error as Error, false));
      throw error;
    }
  }

  async sendHLSTimedMetadata(metadataList: HLSTimedMetadata[]) {
    this.validateJoined('sendHLSTimedMetadata');
    await this.transport?.sendHLSTimedMetadata(metadataList);
  }

  async changeName(name: string) {
    this.validateJoined('changeName');
    await this.transport?.changeName(name);
    this.notificationManager.updateLocalPeer({ name });
  }

  async changeMetadata(metadata: string) {
    this.validateJoined('changeMetadata');
    await this.transport?.changeMetadata(metadata);
    this.notificationManager.updateLocalPeer({ metadata });
  }

  getRoles(): HMSRole[] {
    return Object.values(this.store.getKnownRoles());
  }

  async changeTrackState(forRemoteTrack: HMSRemoteTrack, enabled: boolean) {
    if (forRemoteTrack.type === HMSTrackType.VIDEO && forRemoteTrack.source !== 'regular') {
      HMSLogger.w(this.TAG, `Muting non-regular video tracks is currently not supported`);
      return;
    }

    if (forRemoteTrack.enabled === enabled) {
      HMSLogger.w(this.TAG, `Aborting change track state, track already has enabled - ${enabled}`, forRemoteTrack);
      return;
    }

    if (!this.store.getTrackById(forRemoteTrack.trackId)) {
      throw ErrorFactory.GenericErrors.ValidationFailed('No track found for change track state', forRemoteTrack);
    }

    const peer = this.store.getPeerByTrackId(forRemoteTrack.trackId);

    if (!peer) {
      throw ErrorFactory.GenericErrors.ValidationFailed('No peer found for change track state', forRemoteTrack);
    }

    await this.transport?.changeTrackState({
      requested_for: peer.peerId,
      track_id: forRemoteTrack.trackId,
      stream_id: forRemoteTrack.stream.id,
      mute: !enabled,
    });
  }

  async changeMultiTrackState(params: HMSChangeMultiTrackStateParams) {
    if (typeof params.enabled !== 'boolean') {
      throw ErrorFactory.GenericErrors.ValidationFailed('Pass a boolean for enabled');
    }
    const { enabled, roles, type, source } = params;
    await this.transport?.changeMultiTrackState({
      value: !enabled,
      type,
      source,
      roles: roles?.map(role => role?.name),
    });
  }

  private async publish(initialSettings: InitialSettings) {
    const tracks = await this.localTrackManager.getTracksToPublish(initialSettings);
    await this.setAndPublishTracks(tracks);
    this.sdkState.published = true;
  }

  private handleLocalRoleUpdate = async ({ oldRole, newRole }: { oldRole: HMSRole; newRole: HMSRole }) => {
    await this.transport.handleLocalRoleUpdate({ oldRole, newRole });
    await this.roleChangeManager?.handleLocalPeerRoleUpdate({ oldRole, newRole });
  };

  private async setAndPublishTracks(tracks: HMSLocalTrack[]) {
    for (const track of tracks) {
      await this.transport.publish([track]);
      this.setLocalPeerTrack(track);
      this.listener?.onTrackUpdate(HMSTrackUpdate.TRACK_ADDED, track, this.localPeer!);
    }
    await this.initDeviceManagers();
  }

  private setLocalPeerTrack(track: HMSLocalTrack) {
    track.peerId = this.localPeer?.peerId;
    switch (track.type) {
      case HMSTrackType.AUDIO:
        this.localPeer!.audioTrack = track as HMSLocalAudioTrack;
        break;

      case HMSTrackType.VIDEO:
        this.localPeer!.videoTrack = track as HMSLocalVideoTrack;
        break;
    }
  }

  private async initDeviceManagers() {
    // No need to initialise and add listeners if already initialised in preview
    if (this.sdkState.deviceManagersInitialised) {
      return;
    }
    this.sdkState.deviceManagersInitialised = true;
    await this.deviceManager.init();
    this.deviceManager.updateOutputDevice(DeviceStorageManager.getSelection()?.audioOutput?.deviceId);
    this.audioSinkManager.init(this.store.getConfig()?.audioSinkElementId);
  }

  private cleanDeviceManagers() {
    this.eventBus.deviceChange.unsubscribe(this.handleDeviceChange);
    this.eventBus.audioPluginFailed.unsubscribe(this.handleAudioPluginError);
    this.eventBus.autoplayError.unsubscribe(this.handleAutoplayError);
    this.deviceManager.cleanUp();
    this.audioSinkManager.cleanUp();
  }

  private initPreviewTrackAudioLevelMonitor() {
    const localAudioTrack = this.localPeer?.audioTrack;
    localAudioTrack?.initAudioLevelMonitor();
    this.eventBus.trackAudioLevelUpdate.subscribe(audioLevelUpdate => {
      const hmsSpeakers =
        audioLevelUpdate && audioLevelUpdate.track.trackId === localAudioTrack?.trackId
          ? [{ audioLevel: audioLevelUpdate.audioLevel, peer: this.localPeer!, track: localAudioTrack! }]
          : [];
      this.store.updateSpeakers(hmsSpeakers);
      this.audioListener?.onAudioLevelUpdate(hmsSpeakers);
    });
    this.eventBus.localAudioSilence.subscribe(this.sendAudioPresenceFailed);
  }

  private notifyJoin() {
    const localPeer = this.store.getLocalPeer();
    const room = this.store.getRoom();
    room.joinedAt = new Date();
    if (localPeer) {
      localPeer.joinedAt = room.joinedAt;
    }

    if (localPeer?.role) {
      this.analyticsTimer.end(TimedEvent.JOIN);
      this.listener?.onJoin(room);
    } else {
      this.eventBus.policyChange.subscribeOnce(() => {
        this.analyticsTimer.end(TimedEvent.JOIN);
        this.listener?.onJoin(room);
      });
    }
  }

  /**
   * Init store and other managers, setup listeners, create local peer, room
   * @param {HMSConfig} config
   * @param {HMSPreviewListener} listener
   */
  private setUpPreview(config: HMSConfig, listener: HMSPreviewListener) {
    this.listener = listener as unknown as HMSUpdateListener;
    this.sdkState.isPreviewInProgress = true;
    const { roomId, userId, role } = decodeJWT(config.authToken);
    this.commonSetup(config, roomId, listener);
    this.store.setConfig(config);
    this.createAndAddLocalPeerToStore(config, role, userId);
    HMSLogger.d(this.TAG, 'SDK Store', this.store);
  }

  /**
   * Set bitrate and dimensions for playlist track
   */
  private async setPlaylistSettings({
    track,
    hmsTrack,
    source,
  }: {
    track: MediaStreamTrack;
    hmsTrack: HMSLocalAudioTrack | HMSLocalVideoTrack;
    source: string;
  }) {
    if (source === 'videoplaylist') {
      const settings: { maxBitrate?: number; width?: number; height?: number } = {};
      if (track.kind === 'audio') {
        settings.maxBitrate = 64;
      } else {
        settings.maxBitrate = 1000;
        const { width, height } = track.getSettings();
        settings.width = width;
        settings.height = height;
      }
      // TODO: rt update from policy once policy is updated
      await hmsTrack.setSettings(settings);
    } else if (source === 'audioplaylist') {
      // TODO: rt update from policy once policy is updated
      await hmsTrack.setSettings({ maxBitrate: 64 });
    }
  }

  /**
   * @param {HMSConfig} config
   * @param {string} role
   * @param {string} userId
   */
  private createAndAddLocalPeerToStore(config: HMSConfig, role: string, userId: string) {
    const policy = this.store.getPolicyForRole(role);
    const localPeer = new HMSLocalPeer({
      name: config.userName || '',
      customerUserId: userId,
      metadata: config.metaData || '',
      role: policy,
    });

    this.store.addPeer(localPeer);
  }

  /**
   * init managers and set listeners - common for join and preview
   * @param {HMSConfig} config
   * @param {string} roomId
   * @param {HMSPreviewListener | HMSUpdateListener} listener
   */
  private commonSetup(config: HMSConfig, roomId: string, listener: HMSPreviewListener | HMSUpdateListener) {
    this.stringifyMetadata(config);
    if (!config.initEndpoint) {
      config.initEndpoint = 'https://prod-init.100ms.live';
    }
    this.errorListener = listener;
    this.deviceChangeListener = listener;
    this.initStoreAndManagers();

    this.store.setErrorListener(this.errorListener);
    if (!this.store.getRoom()) {
      this.store.setRoom(new HMSRoom(roomId, this.store));
    }
  }

  /**
   * Remove deviceId's passed in config for join if preview was already called
   * @param {HMSConfig} config
   */
  private removeDevicesFromConfig(config: HMSConfig) {
    const storedConfig = this.store.getConfig();
    if (storedConfig && config.settings) {
      // preview was called
      delete config.settings.audioOutputDeviceId;
      delete config.settings.videoDeviceId;
      delete config.settings.audioInputDeviceId;
    }
  }

  /**
   * Get screenshare based on policy and audioOnly flag
   * @param {PublishParams} publishParams
   * @param {function} onStop
   * @param config
   * @returns
   */
  private async getScreenshareTracks(onStop: () => void, config: ScreenShareConfig) {
    const { video, audio } = this.getScreenshareSettings(config.videoOnly);
    const [videoTrack, audioTrack] = await this.transport!.getLocalScreen(video, audio);

    const handleEnded = () => {
      this.stopEndedScreenshare(onStop);
    };

    const tracks = [];
    if (config.audioOnly) {
      videoTrack.nativeTrack.stop();
      if (!audioTrack) {
        throw Error('Select share audio when sharing screen');
      }
      tracks.push(audioTrack);
      audioTrack.nativeTrack.onended = handleEnded;
    } else {
      tracks.push(videoTrack);
      videoTrack.nativeTrack.onended = handleEnded;
      // audio track is not always available
      if (audioTrack) {
        tracks.push(audioTrack);
      }
    }
    return tracks;
  }

  private getScreenshareSettings = (videoOnly: boolean) => {
    const { screen } = this.store.getPublishParams()!;
    const dimensions = this.store.getSimulcastDimensions('screen');

    return {
      video: new HMSVideoTrackSettingsBuilder()
        // Don't cap maxBitrate for screenshare.
        // If publish params doesn't have bitRate value - don't set maxBitrate.
        .maxBitrate(screen.bitRate, false)
        .codec(screen.codec as HMSVideoCodec)
        .maxFramerate(screen.frameRate)
        .setWidth(dimensions?.width || screen.width)
        .setHeight(dimensions?.height || screen.height)
        .build(),
      audio: videoOnly ? undefined : new HMSAudioTrackSettingsBuilder().build(),
    };
  };

  private sendAudioPresenceFailed = () => {
    const error = ErrorFactory.TracksErrors.NoAudioDetected(HMSAction.PREVIEW);
    this.sendAnalyticsEvent(
      AnalyticsEventFactory.audioDetectionFail(error, this.deviceManager.getCurrentSelection().audioInput),
    );
    // @TODO: start sending if error is less frequent
    // this.listener?.onError(error);
  };

  private sendJoinAnalyticsEvent = (is_preview_called = false, error?: HMSException) => {
    this.eventBus.analytics.publish(
      AnalyticsEventFactory.join({
        error,
        ...this.analyticsTimer.getTimes(
          TimedEvent.INIT,
          TimedEvent.WEBSOCKET_CONNECT,
          TimedEvent.ON_POLICY_CHANGE,
          TimedEvent.LOCAL_TRACKS,
        ),
        time: this.analyticsTimer.getTimeTaken(TimedEvent.JOIN),
        is_preview_called,
      }),
    );
  };

  private sendPreviewAnalyticsEvent = (error?: HMSException) => {
    this.eventBus.analytics.publish(
      AnalyticsEventFactory.preview({
        error,
        ...this.analyticsTimer.getTimes(
          TimedEvent.INIT,
          TimedEvent.WEBSOCKET_CONNECT,
          TimedEvent.ON_POLICY_CHANGE,
          TimedEvent.LOCAL_TRACKS,
        ),
        time: this.analyticsTimer.getTimeTaken(TimedEvent.PREVIEW),
      }),
    );
  };

  private sendAnalyticsEvent = (event: AnalyticsEvent) => {
    this.analyticsEventsService.queue(event).flush();
  };
}
