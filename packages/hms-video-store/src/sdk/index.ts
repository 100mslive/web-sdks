import HMSRoom from './models/HMSRoom';
import { HMSLocalPeer } from './models/peer';
import { HMSPeerListIterator } from './HMSPeerListIterator';
import { LocalTrackManager } from './LocalTrackManager';
import { NetworkTestManager } from './NetworkTestManager';
import RoleChangeManager from './RoleChangeManager';
import { Store } from './store';
import { WakeLockManager } from './WakeLockManager';
import AnalyticsEvent from '../analytics/AnalyticsEvent';
import AnalyticsEventFactory from '../analytics/AnalyticsEventFactory';
import { HMSAnalyticsLevel } from '../analytics/AnalyticsEventLevel';
import { AnalyticsEventsService } from '../analytics/AnalyticsEventsService';
import { AnalyticsTimer, TimedEvent } from '../analytics/AnalyticsTimer';
import { AudioSinkManager } from '../audio-sink-manager';
import { PluginUsageTracker } from '../common/PluginUsageTracker';
import { DeviceManager } from '../device-manager';
import { AudioOutputManager } from '../device-manager/AudioOutputManager';
import { DeviceStorageManager } from '../device-manager/DeviceStorage';
import { HMSDiagnosticsConnectivityListener } from '../diagnostics/interfaces';
import { FeedbackService, HMSSessionFeedback, HMSSessionInfo } from '../end-call-feedback';
import { ErrorCodes } from '../error/ErrorCodes';
import { ErrorFactory } from '../error/ErrorFactory';
import { HMSAction } from '../error/HMSAction';
import { HMSException } from '../error/HMSException';
import { EventBus } from '../events/EventBus';
import {
  HMSAudioCodec,
  HMSChangeMultiTrackStateParams,
  HMSConfig,
  HMSConnectionQualityListener,
  HMSDeviceChangeEvent,
  HMSFrameworkInfo,
  HMSMessageInput,
  HMSPeerType,
  HMSPlaylistSettings,
  HMSPlaylistType,
  HMSPreviewConfig,
  HMSRole,
  HMSRoleChangeRequest,
  HMSScreenShareConfig,
  HMSVideoCodec,
  TokenRequest,
  TokenRequestOptions,
} from '../interfaces';
import { DeviceChangeListener } from '../interfaces/devices';
import { IErrorListener } from '../interfaces/error-listener';
import { HLSConfig, HLSTimedMetadata, StopHLSConfig } from '../interfaces/hls-config';
import { HMSInterface } from '../interfaces/hms';
import { HMSLeaveRoomRequest } from '../interfaces/leave-room-request';
import { HMSPeerListIteratorOptions } from '../interfaces/peer-list-iterator';
import { HMSPreviewListener } from '../interfaces/preview-listener';
import { RTMPRecordingConfig } from '../interfaces/rtmp-recording-config';
import InitialSettings from '../interfaces/settings';
import { HMSAudioListener, HMSPeerUpdate, HMSTrackUpdate, HMSUpdateListener } from '../interfaces/update-listener';
import { PlaylistManager, TranscriptionConfig } from '../internal';
import { HMSAudioTrackSettingsBuilder, HMSVideoTrackSettingsBuilder } from '../media/settings';
import { HMSLocalStream } from '../media/streams/HMSLocalStream';
import {
  HMSLocalAudioTrack,
  HMSLocalTrack,
  HMSLocalVideoTrack,
  HMSRemoteTrack,
  HMSTrackSource,
  HMSTrackType,
  HMSVideoTrack,
} from '../media/tracks';
import {
  HMSNotificationMethod,
  PeerLeaveRequestNotification,
  PeerNotificationInfo,
  SendMessage,
} from '../notification-manager';
import { createRemotePeer } from '../notification-manager/managers/utils';
import { NotificationManager } from '../notification-manager/NotificationManager';
import { DebugInfo } from '../schema';
import { SessionStore } from '../session-store';
import { InteractivityCenter } from '../session-store/interactivity-center';
import { InitConfig, InitFlags } from '../signal/init/models';
import {
  FindPeerByNameRequestParams,
  HLSRequestParams,
  HLSTimedMetadataParams,
  HLSVariant,
  StartRTMPOrRecordingRequestParams,
  StartTranscriptionRequestParams,
} from '../signal/interfaces';
import HMSTransport from '../transport';
import ITransportObserver from '../transport/ITransportObserver';
import { TransportState } from '../transport/models/TransportState';
import { getAnalyticsDeviceId } from '../utils/analytics-deviceId';
import {
  DEFAULT_PLAYLIST_AUDIO_BITRATE,
  DEFAULT_PLAYLIST_VIDEO_BITRATE,
  HAND_RAISE_GROUP_NAME,
  LEAVE_REASON,
} from '../utils/constants';
import { fetchWithRetry } from '../utils/fetch';
import decodeJWT from '../utils/jwt';
import HMSLogger, { HMSLogLevel } from '../utils/logger';
import { HMSAudioContextHandler } from '../utils/media';
import { isNode } from '../utils/support';
import { workerSleep } from '../utils/timer-utils';
import { validateMediaDevicesExistence, validatePublishParams, validateRTCPeerConnection } from '../utils/validations';

const INITIAL_STATE = {
  published: false,
  isInitialised: false,
  isReconnecting: false,
  isPreviewInProgress: false,
  isPreviewCalled: false,
  isJoinInProgress: false,
  deviceManagersInitialised: false,
};

export class HMSSdk implements HMSInterface {
  private transport!: HMSTransport;
  private readonly TAG = '[HMSSdk]:';
  public listener?: HMSUpdateListener;
  private errorListener?: IErrorListener;
  private deviceChangeListener?: DeviceChangeListener;
  private audioListener?: HMSAudioListener;
  public store!: Store;
  private notificationManager?: NotificationManager;
  /** @internal */
  public deviceManager!: DeviceManager;
  private audioSinkManager!: AudioSinkManager;
  private playlistManager!: PlaylistManager;
  private audioOutput!: AudioOutputManager;
  private transportState: TransportState = TransportState.Disconnected;
  private roleChangeManager?: RoleChangeManager;
  /** @internal */
  public localTrackManager!: LocalTrackManager;
  private analyticsEventsService!: AnalyticsEventsService;
  private analyticsTimer = new AnalyticsTimer();
  private eventBus!: EventBus;
  private networkTestManager!: NetworkTestManager;
  private wakeLockManager!: WakeLockManager;
  private sessionStore!: SessionStore;
  private interactivityCenter!: InteractivityCenter;
  private pluginUsageTracker!: PluginUsageTracker;
  private sdkState = { ...INITIAL_STATE };
  private frameworkInfo?: HMSFrameworkInfo;
  private isDiagnostics = false;
  /**
   * will be set post join
   * this will not be reset on leave but after feedback success
   * we will just clean token after successful submit feedback
   * will be replaced when a newer join happens.
   */
  private sessionPeerInfo?: HMSSessionInfo;

  private playlistSettings: HMSPlaylistSettings = {
    video: {
      bitrate: DEFAULT_PLAYLIST_VIDEO_BITRATE,
    },
    audio: {
      bitrate: DEFAULT_PLAYLIST_AUDIO_BITRATE,
    },
  };

  private setSessionPeerInfo(websocketURL: string, peer?: HMSLocalPeer) {
    const room = this.store.getRoom();
    if (!peer || !room) {
      HMSLogger.e(this.TAG, 'setSessionPeerInfo> Local peer or room is undefined');
      return;
    }
    this.sessionPeerInfo = {
      peer: {
        peer_id: peer.peerId,
        role: peer.role?.name,
        joined_at: peer.joinedAt?.valueOf() || 0,
        room_name: room.name,
        session_started_at: room.startedAt?.valueOf() || 0,
        user_data: peer.customerUserId,
        user_name: peer.name,
        template_id: room.templateId,
        session_id: room.sessionId,
        token: this.store.getConfig()?.authToken,
      },
      agent: this.store.getUserAgent(),
      device_id: getAnalyticsDeviceId(),
      cluster: {
        websocket_url: websocketURL,
      },
      timestamp: Date.now(),
    };
  }
  private initNotificationManager() {
    if (!this.notificationManager) {
      this.notificationManager = new NotificationManager(
        this.store,
        this.eventBus,
        this.transport!,
        this.listener,
        this.audioListener,
      );
    }
  }

  /** @internal */
  initStoreAndManagers(listener: HMSPreviewListener | HMSUpdateListener | HMSDiagnosticsConnectivityListener) {
    this.listener = listener as unknown as HMSUpdateListener;
    this.errorListener = listener;
    this.deviceChangeListener = listener;
    this.store?.setErrorListener(this.errorListener);

    if (this.sdkState.isInitialised) {
      /**
       * Set listener after both join and preview, since they can have different listeners
       */
      this.notificationManager?.setListener(this.listener);
      this.audioSinkManager.setListener(this.listener);
      this.interactivityCenter.setListener(this.listener);
      this.transport.setListener(this.listener);
      return;
    }

    this.sdkState.isInitialised = true;
    this.store = new Store();
    this.store.setErrorListener(this.errorListener);
    this.eventBus = new EventBus();
    this.pluginUsageTracker = new PluginUsageTracker(this.eventBus);
    this.wakeLockManager = new WakeLockManager();
    this.networkTestManager = new NetworkTestManager(this.eventBus, this.listener);
    this.playlistManager = new PlaylistManager(this, this.eventBus);
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
      this.eventBus,
      this.analyticsEventsService,
      this.analyticsTimer,
      this.pluginUsageTracker,
    );
    // add diagnostics callbacks if present
    if ('onInitSuccess' in listener) {
      this.transport.setConnectivityListener(listener);
    }
    this.sessionStore = new SessionStore(this.transport);
    this.interactivityCenter = new InteractivityCenter(this.transport, this.store, this.listener);
    /**
     * Note: Subscribe to events here right after creating stores and managers
     * to not miss events that are published before the handlers are subscribed.
     */
    this.eventBus.analytics.subscribe(this.sendAnalyticsEvent);
    this.eventBus.deviceChange.subscribe(this.handleDeviceChange);
    this.eventBus.localVideoUnmutedNatively.subscribe(this.unpauseRemoteVideoTracks);
    this.eventBus.localAudioUnmutedNatively.subscribe(this.unpauseRemoteVideoTracks);
    this.eventBus.audioPluginFailed.subscribe(this.handleAudioPluginError);
    this.eventBus.error.subscribe(this.handleError);
  }

  private validateJoined(name: string) {
    if (!this.localPeer) {
      throw ErrorFactory.GenericErrors.NotConnected(HMSAction.VALIDATION, `Not connected - ${name}`);
    }
  }

  // @ts-ignore
  private sendHLSAnalytics(error: HMSException) {
    this.sendAnalyticsEvent(AnalyticsEventFactory.hlsPlayerError(error));
  }

  async refreshDevices() {
    this.validateJoined('refreshDevices');
    await this.deviceManager.init(true);
  }

  getWebrtcInternals() {
    return this.transport?.getWebrtcInternals();
  }

  getDebugInfo(): DebugInfo | undefined {
    if (!this.transport) {
      HMSLogger.e(this.TAG, `Transport is not defined`);
      throw new Error('getDebugInfo can only be called after join');
    }
    const websocketURL = this.transport.getWebsocketEndpoint();
    const enabledFlags = Object.values(InitFlags).filter(flag => this.transport.isFlagEnabled(flag));
    const initEndpoint = this.store.getConfig()?.initEndpoint;
    return {
      websocketURL,
      enabledFlags,
      initEndpoint,
    };
  }

  getSessionStore() {
    return this.sessionStore;
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

  getTranscriptionState() {
    return this.store.getRoom()?.transcriptions;
  }

  getTemplateAppData() {
    return this.store.getTemplateAppData();
  }

  getInteractivityCenter() {
    return this.interactivityCenter;
  }

  getPeerListIterator(options?: HMSPeerListIteratorOptions) {
    return new HMSPeerListIterator(this.transport, this.store, options);
  }

  updatePlaylistSettings(options: HMSPlaylistSettings) {
    if (options.video) {
      Object.assign(this.playlistSettings.video, options.video);
    }
    if (options.audio) {
      Object.assign(this.playlistSettings.audio, options.audio);
    }
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

      switch (message.method) {
        case HMSNotificationMethod.POLICY_CHANGE:
          this.analyticsTimer.end(TimedEvent.ON_POLICY_CHANGE);
          break;
        case HMSNotificationMethod.PEER_LIST:
          this.analyticsTimer.end(TimedEvent.PEER_LIST);
          this.sendJoinAnalyticsEvent(this.sdkState.isPreviewCalled);
          break;
        case HMSNotificationMethod.ROOM_STATE:
          this.analyticsTimer.end(TimedEvent.ROOM_STATE);
          break;
        default:
      }

      this.notificationManager?.handleNotification(message, this.sdkState.isReconnecting);
    },

    onConnected: () => {
      this.initNotificationManager();
    },

    onTrackAdd: (track: HMSRemoteTrack) => {
      this.notificationManager?.handleTrackAdd(track);
    },

    onTrackRemove: (track: HMSRemoteTrack) => {
      this.notificationManager?.handleTrackRemove(track);
    },

    onFailure: (exception: HMSException) => {
      this.errorListener?.onError(exception);
    },

    onStateChange: async (state: TransportState, error?: HMSException) => {
      const handleFailedState = async (error?: HMSException) => {
        await this.internalLeave(true, error);
        /**
         * no need to call onError here when preview/join is in progress
         * since preview/join will call onError when they receive leave event from the above call
         */
        if (!this.sdkState.isPreviewInProgress && !this.sdkState.isJoinInProgress) {
          this.errorListener?.onError?.(error!);
        }
        this.sdkState.isReconnecting = false;
      };

      switch (state) {
        case TransportState.Preview:
        case TransportState.Joined:
          this.initNotificationManager();
          if (this.transportState === TransportState.Reconnecting) {
            this.listener?.onReconnected();
          }
          break;
        case TransportState.Failed:
          await handleFailedState(error);
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
    this.internalLeave(false);
  };

  async preview(config: HMSPreviewConfig, listener: HMSPreviewListener) {
    validateMediaDevicesExistence();
    validateRTCPeerConnection();

    if (this.sdkState.isPreviewInProgress) {
      return Promise.reject(
        ErrorFactory.GenericErrors.PreviewAlreadyInProgress(HMSAction.PREVIEW, 'Preview already called'),
      );
    }

    if ([TransportState.Joined, TransportState.Reconnecting].includes(this.transportState)) {
      return this.midCallPreview(config.asRole, config.settings);
    }

    this.analyticsTimer.start(TimedEvent.PREVIEW);
    this.setUpPreview(config, listener);

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
        if (this.localPeer) {
          const newRole = config.asRole && this.store.getPolicyForRole(config.asRole);
          this.localPeer.asRole = newRole || this.localPeer.role;
        }
        const tracks = await this.localTrackManager.getTracksToPublish(config.settings);
        tracks.forEach(track => {
          this.setLocalPeerTrack(track);
          if (track.isTrackNotPublishing()) {
            const error = ErrorFactory.TracksErrors.NoDataInTrack(
              `${track.type} track has no data. muted: ${track.nativeTrack.muted}, readyState: ${track.nativeTrack.readyState}`,
            );
            HMSLogger.e(this.TAG, error);
            this.sendAnalyticsEvent(
              AnalyticsEventFactory.publish({
                devices: this.deviceManager.getDevices(),
                error: error,
              }),
            );
            this.listener?.onError(error);
          }
        });
        this.localPeer?.audioTrack && this.initPreviewTrackAudioLevelMonitor();
        await this.initDeviceManagers();
        this.sdkState.isPreviewInProgress = false;
        this.analyticsTimer.end(TimedEvent.PREVIEW);
        const room = this.store.getRoom();
        if (room) {
          listener.onPreview(room, tracks);
        }
        this.sendPreviewAnalyticsEvent();
        resolve();
      };

      this.eventBus.policyChange.subscribeOnce(policyHandler);
      this.eventBus.leave.subscribeOnce(this.handlePreviewError);
      this.eventBus.leave.subscribeOnce(ex => reject(ex as HMSException));

      this.transport
        .preview(
          config.authToken,
          config.initEndpoint!,
          this.localPeer!.peerId,
          { name: config.userName, metaData: config.metaData || '' },
          config.autoVideoSubscribe,
          config.iceServers,
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
          this.handlePreviewError(ex);
          reject(ex);
        });
    });
  }

  private handlePreviewError = (ex?: HMSException) => {
    this.analyticsTimer.end(TimedEvent.PREVIEW);
    ex && this.errorListener?.onError(ex);
    this.sendPreviewAnalyticsEvent(ex);
    this.sdkState.isPreviewInProgress = false;
  };

  private async midCallPreview(asRole?: string, settings?: InitialSettings): Promise<void> {
    if (!this.localPeer || this.transportState !== TransportState.Joined) {
      throw ErrorFactory.GenericErrors.NotConnected(HMSAction.VALIDATION, 'Not connected - midCallPreview');
    }

    const newRole = asRole && this.store.getPolicyForRole(asRole);
    if (!newRole) {
      throw ErrorFactory.GenericErrors.InvalidRole(HMSAction.PREVIEW, `role ${asRole} does not exist in policy`);
    }
    this.localPeer.asRole = newRole;

    const tracks = await this.localTrackManager.getTracksToPublish(settings);
    tracks.forEach(track => this.setLocalPeerTrack(track));
    this.localPeer?.audioTrack && this.initPreviewTrackAudioLevelMonitor();
    await this.initDeviceManagers();

    this.listener?.onPreview(this.store.getRoom()!, tracks);
  }

  async cancelMidCallPreview() {
    if (!this.localPeer || !this.localPeer.isInPreview()) {
      HMSLogger.w(this.TAG, 'Cannot cancel mid call preview as preview is not in progress');
    }

    if (this.localPeer?.asRole && this.localPeer.role) {
      const oldRole = this.localPeer.asRole;
      const newRole = this.localPeer.role;
      delete this.localPeer.asRole;
      await this.roleChangeManager?.diffRolesAndPublishTracks({
        oldRole,
        newRole,
      });

      this.listener?.onPeerUpdate(HMSPeerUpdate.ROLE_UPDATED, this.localPeer);
    }
  }

  private handleDeviceChange = (event: HMSDeviceChangeEvent) => {
    if (event.isUserSelection) {
      return;
    }
    HMSLogger.d(this.TAG, 'Device Change event', event);
    this.deviceChangeListener?.onDeviceChange?.(event);
    const disableTrackOnError = () => {
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
    disableTrackOnError();
  };

  private handleAudioPluginError = (error: HMSException) => {
    HMSLogger.e(this.TAG, 'Audio Plugin Error event', error);
    this.errorListener?.onError(error);
  };

  /**
   * This is to handle errors thrown from internal handling of audio video track changes
   * For example, handling visibility change and making a new gum can throw an error which is currently
   * unhandled. This will notify the app of the error.
   * @param {HMSException} error
   */
  private handleError = (error: HMSException) => {
    HMSLogger.e(this.TAG, error);
    this.errorListener?.onError(error);
  };

  // eslint-disable-next-line complexity
  async join(config: HMSConfig, listener: HMSUpdateListener) {
    validateMediaDevicesExistence();
    validateRTCPeerConnection();

    if (this.sdkState.isPreviewInProgress) {
      throw ErrorFactory.GenericErrors.NotReady(HMSAction.JOIN, "Preview is in progress, can't join");
    }

    // remove terminal error handling from preview(do not send preview.failed after join on disconnect)
    this.eventBus?.leave?.unsubscribe(this.handlePreviewError);
    this.analyticsTimer.start(TimedEvent.JOIN);
    this.sdkState.isJoinInProgress = true;

    const { roomId, userId, role } = decodeJWT(config.authToken);
    const previewRole = this.localPeer?.asRole?.name || this.localPeer?.role?.name;
    this.networkTestManager?.stop();
    this.commonSetup(config, roomId, listener);
    this.removeDevicesFromConfig(config);
    this.store.setConfig(config);
    /** set after config since we need config to get env for user agent */
    this.store.createAndSetUserAgent(this.frameworkInfo);
    HMSAudioContextHandler.resumeContext();
    // acquire screen lock to stay awake while in call
    const storeConfig = this.store.getConfig();
    if (storeConfig?.autoManageWakeLock) {
      this.wakeLockManager.acquireLock();
    }

    if (!this.localPeer) {
      this.createAndAddLocalPeerToStore(config, role, userId);
    } else {
      this.localPeer.name = config.userName;
      this.localPeer.role = this.store.getPolicyForRole(role);
      this.localPeer.customerUserId = userId;
      this.localPeer.metadata = config.metaData;
      delete this.localPeer.asRole;
    }

    this.roleChangeManager = new RoleChangeManager(
      this.store,
      this.transport,
      this.deviceManager,
      this.getAndPublishTracks.bind(this),
      this.removeTrack.bind(this),
      this.listener,
    );
    this.eventBus.localRoleUpdate.subscribe(this.handleLocalRoleUpdate);

    HMSLogger.d(this.TAG, `⏳ Joining room ${roomId}`);

    HMSLogger.time(`join-room-${roomId}`);

    try {
      await this.transport.join(
        config.authToken,
        this.localPeer!.peerId,
        { name: config.userName, metaData: config.metaData! },
        config.initEndpoint!,
        config.autoVideoSubscribe,
        config.iceServers,
      );
      HMSLogger.d(this.TAG, `✅ Joined room ${roomId}`);
      this.analyticsTimer.start(TimedEvent.PEER_LIST);
      await this.notifyJoin();
      this.sdkState.isJoinInProgress = false;
      await this.publish(config.settings, previewRole);
    } catch (error) {
      this.analyticsTimer.end(TimedEvent.JOIN);
      this.sdkState.isJoinInProgress = false;
      this.listener?.onError(error as HMSException);
      this.sendJoinAnalyticsEvent(this.sdkState.isPreviewCalled, error as HMSException);
      HMSLogger.e(this.TAG, 'Unable to join room', error);
      throw error;
    }
    HMSLogger.timeEnd(`join-room-${roomId}`);
  }

  private stringifyMetadata(config: HMSConfig) {
    if (config.metaData && typeof config.metaData !== 'string') {
      config.metaData = JSON.stringify(config.metaData);
    } else if (!config.metaData) {
      config.metaData = '';
    }
  }

  private cleanup() {
    this.cleanDeviceManagers();
    this.eventBus.analytics.unsubscribe(this.sendAnalyticsEvent);
    this.eventBus.localVideoUnmutedNatively.unsubscribe(this.unpauseRemoteVideoTracks);
    this.eventBus.localAudioUnmutedNatively.unsubscribe(this.unpauseRemoteVideoTracks);
    this.eventBus.error.unsubscribe(this.handleError);
    this.analyticsTimer.cleanup();
    DeviceStorageManager.cleanup();
    this.playlistManager.cleanup();
    this.wakeLockManager?.cleanup();
    LocalTrackManager.cleanup();
    this.notificationManager = undefined;
    HMSLogger.cleanup();
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
    this.store.cleanup();
    this.listener = undefined;
    if (this.roleChangeManager) {
      this.eventBus.localRoleUpdate.unsubscribe(this.handleLocalRoleUpdate);
    }
  }

  leave(notifyServer?: boolean) {
    return this.internalLeave(notifyServer);
  }

  // eslint-disable-next-line complexity
  private async internalLeave(notifyServer = true, error?: HMSException) {
    const room = this.store?.getRoom();
    if (room) {
      // Wait for preview or join to finish to prevent any race conditions happening because preview/join are called multiple times
      // This can happen when useEffects are not properly handled in case of react apps
      // when error is terminal this will go into infinite loop so error?.isTerminal check is needed
      while ((this.sdkState.isPreviewInProgress || this.sdkState.isJoinInProgress) && !error?.isTerminal) {
        await workerSleep(100);
      }
      const roomId = room.id;
      // setSessionJoin
      this.setSessionPeerInfo(this.transport.getWebsocketEndpoint() || '', this.localPeer);
      this.networkTestManager?.stop();
      this.eventBus.leave.publish(error);
      const peerId = this.localPeer?.peerId;
      HMSLogger.d(this.TAG, `⏳ Leaving room ${roomId}, peerId=${peerId}`);
      // browsers often put limitation on amount of time a function set on window onBeforeUnload can take in case of
      // tab refresh or close. Therefore prioritise the leave action over anything else, if tab is closed/refreshed
      // we would want leave to succeed to stop stucked peer for others. The followup cleanup however is important
      // for cases where uses stays on the page post leave.
      await this.transport?.leave(notifyServer, error ? LEAVE_REASON.SDK_REQUEST : LEAVE_REASON.USER_REQUEST);
      this.cleanup();
      HMSLogger.d(this.TAG, `✅ Left room ${roomId}, peerId=${peerId}`);
    }
  }

  async getAuthTokenByRoomCode(tokenRequest: TokenRequest, tokenRequestOptions?: TokenRequestOptions): Promise<string> {
    const tokenAPIURL = (tokenRequestOptions || {}).endpoint || 'https://auth.100ms.live/v2/token';
    this.analyticsTimer.start(TimedEvent.GET_TOKEN);
    const response = await fetchWithRetry(
      tokenAPIURL,
      {
        method: 'POST',
        body: JSON.stringify({ code: tokenRequest.roomCode, user_id: tokenRequest.userId }),
      },
      [429, 500, 501, 502, 503, 504, 505, 506, 507, 508, 509, 510, 511],
    );

    const data = await response.json();
    this.analyticsTimer.end(TimedEvent.GET_TOKEN);

    if (!response.ok) {
      throw ErrorFactory.APIErrors.ServerErrors(data.code, HMSAction.GET_TOKEN, data.message, false);
    }

    const { token } = data;
    if (!token) {
      throw Error(data.message);
    }
    return token;
  }

  getLocalPeer() {
    return this.store.getLocalPeer();
  }

  getPeers() {
    return this.store.getPeers();
  }

  getPeerMap() {
    return this.store.getPeerMap();
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

  async sendDirectMessage(message: string, peerId: string, type?: string) {
    if (this.localPeer?.peerId === peerId) {
      throw ErrorFactory.GenericErrors.ValidationFailed('Cannot send message to self');
    }
    const isLargeRoom = !!this.store.getRoom()?.large_room_optimization;
    let recipientPeer = this.store.getPeerById(peerId);
    if (!recipientPeer) {
      if (isLargeRoom) {
        const peer = await this.transport.signal.getPeer({ peer_id: peerId });
        if (!peer) {
          throw ErrorFactory.GenericErrors.ValidationFailed('Invalid peer - peer not present in the room', peerId);
        }
        recipientPeer = createRemotePeer(peer, this.store);
      } else {
        throw ErrorFactory.GenericErrors.ValidationFailed('Invalid peer - peer not present in the room', peerId);
      }
    }

    return await this.sendMessageInternal({ message, recipientPeer, type });
  }
  async submitSessionFeedback(feedback: HMSSessionFeedback, eventEndpoint?: string) {
    if (!this.sessionPeerInfo) {
      HMSLogger.e(this.TAG, 'submitSessionFeedback> session is undefined');
      throw new Error('session is undefined');
    }
    const token = this.sessionPeerInfo.peer.token;
    if (!token) {
      HMSLogger.e(this.TAG, 'submitSessionFeedback> token is undefined');
      throw new Error('Internal error, token is not present');
    }
    try {
      await FeedbackService.sendFeedback({
        token: token,
        info: this.sessionPeerInfo,
        feedback,
        eventEndpoint,
      });
      HMSLogger.i(this.TAG, 'submitSessionFeedback> submitted feedback');
      this.sessionPeerInfo = undefined;
    } catch (e) {
      HMSLogger.e(this.TAG, 'submitSessionFeedback> error occured ', e);
      throw new Error('Unable to submit feedback');
    }
  }
  async getPeer(peerId: string) {
    const response = await this.transport.signal.getPeer({ peer_id: peerId });
    if (response) {
      return createRemotePeer(response, this.store);
    }
    return undefined;
  }

  async findPeerByName({ query, limit = 10, offset }: FindPeerByNameRequestParams) {
    const {
      peers,
      offset: responseOffset,
      eof,
    } = await this.transport.signal.findPeerByName({ query: query?.toLowerCase(), limit, offset });
    if (peers.length > 0) {
      return {
        offset: responseOffset,
        eof,
        peers: peers.map(peerInfo => {
          return createRemotePeer(
            {
              peer_id: peerInfo.peer_id,
              role: peerInfo.role,
              groups: [],
              info: {
                name: peerInfo.name,
                data: '',
                user_id: '',
                type: peerInfo.type,
              },
            } as PeerNotificationInfo,
            this.store,
          );
        }),
      };
    }
    return { offset: responseOffset, peers: [] };
  }

  private async sendMessageInternal({ recipientRoles, recipientPeer, type = 'chat', message }: HMSMessageInput) {
    if (message.replace(/\u200b/g, ' ').trim() === '') {
      HMSLogger.w(this.TAG, 'sendMessage', 'Ignoring empty message send');
      throw ErrorFactory.GenericErrors.ValidationFailed('Empty message not allowed');
    }
    const sendParams: SendMessage = {
      info: {
        message,
        type,
      },
    };
    if (recipientRoles?.length) {
      sendParams.roles = recipientRoles.map(role => role.name);
    }
    if (recipientPeer?.peerId) {
      sendParams.peer_id = recipientPeer.peerId;
    }
    HMSLogger.d(this.TAG, 'Sending Message: ', sendParams);
    return await this.transport.signal.broadcast(sendParams);
  }

  async startScreenShare(onStop: () => void, config?: HMSScreenShareConfig) {
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
    this.transport.setOnScreenshareStop(() => {
      this.stopEndedScreenshare(onStop);
    });
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
    await this.applySettings(hmsTrack);
    await this.setPlaylistSettings({
      track,
      hmsTrack,
      source,
    });

    await this.transport?.publish([hmsTrack]);
    hmsTrack.peerId = this.localPeer?.peerId;
    this.localPeer?.auxiliaryTracks.push(hmsTrack);
    this.listener?.onTrackUpdate(HMSTrackUpdate.TRACK_ADDED, hmsTrack, this.localPeer!);
  }

  async removeTrack(trackId: string, internal = false) {
    if (!this.localPeer) {
      throw ErrorFactory.GenericErrors.NotConnected(HMSAction.VALIDATION, 'No local peer present, cannot removeTrack');
    }
    const trackIndex = this.localPeer.auxiliaryTracks.findIndex(t => t.trackId === trackId);
    if (trackIndex > -1) {
      const track = this.localPeer.auxiliaryTracks[trackIndex];
      if (track.isPublished) {
        await this.transport!.unpublish([track]);
      } else {
        await track.cleanup();
      }
      // Stop local playback when playlist track is removed
      if (!internal) {
        this.stopPlaylist(track);
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

  autoSelectAudioOutput(delay?: number) {
    this.deviceManager?.autoSelectAudioOutput(delay);
  }

  addAudioListener(audioListener: HMSAudioListener) {
    this.audioListener = audioListener;
    this.notificationManager?.setAudioListener(audioListener);
  }

  addConnectionQualityListener(qualityListener: HMSConnectionQualityListener) {
    this.notificationManager?.setConnectionQualityListener(qualityListener);
  }

  /** @internal */
  setIsDiagnostics(isDiagnostics: boolean) {
    this.isDiagnostics = isDiagnostics;
  }

  async changeRole(forPeerId: string, toRole: string, force = false) {
    await this.transport?.signal.requestRoleChange({
      requested_for: forPeerId,
      role: toRole,
      force,
    });
  }

  async changeRoleOfPeer(forPeerId: string, toRole: string, force = false) {
    await this.transport?.signal.requestRoleChange({
      requested_for: forPeerId,
      role: toRole,
      force,
    });
  }

  async changeRoleOfPeersWithRoles(roles: HMSRole[], toRole: string) {
    if (roles.length <= 0 || !toRole) {
      return;
    }
    await this.transport?.signal.requestBulkRoleChange({
      roles: roles.map((role: HMSRole) => role.name),
      role: toRole,
      force: true,
    });
  }

  async acceptChangeRole(request: HMSRoleChangeRequest) {
    await this.transport?.signal.acceptRoleChangeRequest({
      requested_by: request.requestedBy?.peerId,
      role: request.role.name,
      token: request.token,
    });
  }

  async endRoom(lock: boolean, reason: string) {
    if (!this.localPeer) {
      throw ErrorFactory.GenericErrors.NotConnected(HMSAction.VALIDATION, 'No local peer present, cannot end room');
    }
    await this.transport?.signal.endRoom(lock, reason);
    await this.leave();
  }

  async removePeer(peerId: string, reason: string) {
    if (!this.localPeer) {
      throw ErrorFactory.GenericErrors.NotConnected(HMSAction.VALIDATION, 'No local peer present, cannot remove peer');
    }
    await this.transport?.signal.removePeer({ requested_for: peerId, reason });
  }

  async startRTMPOrRecording(params: RTMPRecordingConfig) {
    if (!this.localPeer) {
      throw ErrorFactory.GenericErrors.NotConnected(
        HMSAction.VALIDATION,
        'No local peer present, cannot start streaming or recording',
      );
    }
    const signalParams: StartRTMPOrRecordingRequestParams = {
      meeting_url: params.meetingURL,
      record: params.record,
    };

    if (params.rtmpURLs?.length) {
      signalParams.rtmp_urls = params.rtmpURLs;
    }

    if (params.resolution) {
      signalParams.resolution = params.resolution;
    }

    await this.transport?.signal.startRTMPOrRecording(signalParams);
  }

  async stopRTMPAndRecording() {
    if (!this.localPeer) {
      throw ErrorFactory.GenericErrors.NotConnected(
        HMSAction.VALIDATION,
        'No local peer present, cannot stop streaming or recording',
      );
    }

    await this.transport?.signal.stopRTMPAndRecording();
  }

  async startHLSStreaming(params?: HLSConfig) {
    if (!this.localPeer) {
      throw ErrorFactory.GenericErrors.NotConnected(
        HMSAction.VALIDATION,
        'No local peer present, cannot start HLS streaming',
      );
    }
    const hlsParams: HLSRequestParams = {};
    if (params && params.variants && params.variants.length > 0) {
      hlsParams.variants = params.variants.map(variant => {
        const hlsVariant: HLSVariant = { meeting_url: variant.meetingURL };
        if (variant.metadata) {
          hlsVariant.metadata = variant.metadata;
        }
        return hlsVariant;
      });
    }
    if (params?.recording) {
      hlsParams.hls_recording = {
        single_file_per_layer: params.recording.singleFilePerLayer,
        hls_vod: params.recording.hlsVod,
      };
    }
    await this.transport?.signal.startHLSStreaming(hlsParams);
  }

  async stopHLSStreaming(params?: StopHLSConfig) {
    if (!this.localPeer) {
      throw ErrorFactory.GenericErrors.NotConnected(
        HMSAction.VALIDATION,
        'No local peer present, cannot stop HLS streaming',
      );
    }
    if (params) {
      const hlsParams: HLSRequestParams = {
        variants: params?.variants?.map(variant => {
          const hlsVariant: HLSVariant = { meeting_url: variant.meetingURL };
          if (variant.metadata) {
            hlsVariant.metadata = variant.metadata;
          }
          return hlsVariant;
        }),
        stop_reason: params.stop_reason,
      };

      await this.transport?.signal.stopHLSStreaming(hlsParams);
    } else {
      await this.transport?.signal.stopHLSStreaming();
    }
  }

  async startTranscription(params: TranscriptionConfig) {
    if (!this.localPeer) {
      throw ErrorFactory.GenericErrors.NotConnected(
        HMSAction.VALIDATION,
        'No local peer present, cannot start transcriptions',
      );
    }
    const transcriptionParams: StartTranscriptionRequestParams = {
      mode: params.mode,
    };
    await this.transport?.signal.startTranscription(transcriptionParams);
  }

  async stopTranscription(params: TranscriptionConfig) {
    if (!this.localPeer) {
      throw ErrorFactory.GenericErrors.NotConnected(
        HMSAction.VALIDATION,
        'No local peer present, cannot stop transcriptions',
      );
    }
    if (!params) {
      throw ErrorFactory.GenericErrors.Signalling(HMSAction.VALIDATION, 'No mode is passed to stop the transcription');
    }
    const transcriptionParams: StartTranscriptionRequestParams = {
      mode: params.mode,
    };
    await this.transport?.signal.stopTranscription(transcriptionParams);
  }

  async sendHLSTimedMetadata(metadataList: HLSTimedMetadata[]) {
    this.validateJoined('sendHLSTimedMetadata');
    if (metadataList.length > 0) {
      const hlsMtParams: HLSTimedMetadataParams = {
        metadata_objs: metadataList,
      };
      await this.transport?.signal.sendHLSTimedMetadata(hlsMtParams);
    }
  }

  async changeName(name: string) {
    this.validateJoined('changeName');
    const peer = this.store.getLocalPeer();
    if (peer && peer.name !== name) {
      await this.transport?.signal.updatePeer({
        name: name,
      });
      this.notificationManager?.updateLocalPeer({ name });
    }
  }

  async changeMetadata(metadata: string) {
    this.validateJoined('changeMetadata');
    await this.transport?.signal.updatePeer({
      data: metadata,
    });
    this.notificationManager?.updateLocalPeer({ metadata });
  }

  async setSessionMetadata(metadata: any) {
    await this.transport?.signal.setSessionMetadata({ key: 'default', data: metadata });
  }

  async getSessionMetadata() {
    const response = await this.transport?.signal.getSessionMetadata('default');
    return response.data;
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

    await this.transport?.signal.requestTrackStateChange({
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
    await this.transport?.signal.requestMultiTrackStateChange({
      value: !enabled,
      type,
      source,
      roles: roles?.map(role => role?.name),
    });
  }

  async raiseLocalPeerHand() {
    this.validateJoined('raiseLocalPeerHand');
    await this.transport?.signal.joinGroup(HAND_RAISE_GROUP_NAME);
  }
  async lowerLocalPeerHand() {
    this.validateJoined('lowerLocalPeerHand');
    await this.transport?.signal.leaveGroup(HAND_RAISE_GROUP_NAME);
  }
  async raiseRemotePeerHand(peerId: string) {
    await this.transport?.signal.addToGroup(peerId, HAND_RAISE_GROUP_NAME);
  }
  async lowerRemotePeerHand(peerId: string) {
    await this.transport?.signal.removeFromGroup(peerId, HAND_RAISE_GROUP_NAME);
  }

  setFrameworkInfo(frameworkInfo: HMSFrameworkInfo) {
    this.frameworkInfo = { ...this.frameworkInfo, ...frameworkInfo };
  }

  async attachVideo(track: HMSVideoTrack, videoElement: HTMLVideoElement) {
    const config = this.store.getConfig();
    if (config?.autoManageVideo) {
      track.attach(videoElement);
    } else {
      await track.addSink(videoElement);
    }
  }

  async detachVideo(track: HMSVideoTrack, videoElement: HTMLVideoElement) {
    const config = this.store.getConfig();
    if (config?.autoManageVideo) {
      track.detach(videoElement);
    } else {
      await track.removeSink(videoElement);
    }
  }

  private async publish(initialSettings?: InitialSettings, oldRole?: string) {
    if ([this.store.getPublishParams(), !this.sdkState.published, !isNode].every(value => !!value)) {
      // if preview asRole(oldRole) is used, use roleChangeManager to diff policy and publish, else do normal publish
      const publishAction =
        oldRole && oldRole !== this.localPeer?.role?.name
          ? () =>
              this.roleChangeManager?.diffRolesAndPublishTracks({
                oldRole: this.store.getPolicyForRole(oldRole),
                newRole: this.localPeer!.role!,
              })
          : () => this.getAndPublishTracks(initialSettings);

      await publishAction?.()?.catch(error => {
        HMSLogger.e(this.TAG, 'Error in publish', error);
        this.listener?.onError(error);
      });
    }
  }

  private async getAndPublishTracks(initialSettings?: InitialSettings) {
    const tracks = await this.localTrackManager.getTracksToPublish(initialSettings);
    await this.initDeviceManagers();
    await this.setAndPublishTracks(tracks);
    this.localPeer?.audioTrack?.initAudioLevelMonitor();
    this.sdkState.published = true;
  }

  private handleLocalRoleUpdate = async ({ oldRole, newRole }: { oldRole: HMSRole; newRole: HMSRole }) => {
    this.deviceManager.currentSelection = this.deviceManager.getCurrentSelection();
    await this.transport.handleLocalRoleUpdate({ oldRole, newRole });
    await this.roleChangeManager?.handleLocalPeerRoleUpdate({ oldRole, newRole });
    await this.interactivityCenter.whiteboard.handleLocalRoleUpdate();
  };

  private async setAndPublishTracks(tracks: HMSLocalTrack[]) {
    for (const track of tracks) {
      await this.transport.publish([track]);
      if (track.isTrackNotPublishing()) {
        const error = ErrorFactory.TracksErrors.NoDataInTrack(
          `${track.type} track has no data. muted: ${track.nativeTrack.muted}, readyState: ${track.nativeTrack.readyState}`,
        );
        HMSLogger.e(this.TAG, error);
        this.sendAnalyticsEvent(
          AnalyticsEventFactory.publish({
            devices: this.deviceManager.getDevices(),
            error: error,
          }),
        );
        this.listener?.onError(error);
      }
      await this.setLocalPeerTrack(track);
      this.listener?.onTrackUpdate(HMSTrackUpdate.TRACK_ADDED, track, this.localPeer!);
    }
  }

  private async setLocalPeerTrack(track: HMSLocalTrack) {
    track.peerId = this.localPeer?.peerId;
    switch (track.type) {
      case HMSTrackType.AUDIO:
        this.localPeer!.audioTrack = track as HMSLocalAudioTrack;
        await this.deviceManager.autoSelectAudioOutput();
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
    if (!(await this.deviceManager.updateOutputDevice(this.store.getConfig()?.settings?.audioOutputDeviceId))) {
      await this.deviceManager.updateOutputDevice(DeviceStorageManager.getSelection()?.audioOutput?.deviceId);
    }
    this.audioSinkManager.init(this.store.getConfig()?.audioSinkElementId);
  }

  private cleanDeviceManagers() {
    this.eventBus.deviceChange.unsubscribe(this.handleDeviceChange);
    this.eventBus.audioPluginFailed.unsubscribe(this.handleAudioPluginError);
    this.eventBus.autoplayError.unsubscribe(this.handleAutoplayError);
    this.deviceManager.cleanup();
    this.audioSinkManager.cleanup();
  }

  /** @internal */
  initPreviewTrackAudioLevelMonitor() {
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
    if (!room) {
      HMSLogger.w(this.TAG, 'notify join - room not present');
      return;
    }

    room.joinedAt = new Date();
    if (localPeer) {
      localPeer.joinedAt = room.joinedAt;
    }

    if (localPeer?.role) {
      this.analyticsTimer.end(TimedEvent.JOIN);
      this.listener?.onJoin(room);
      return;
    }

    return new Promise<void>((resolve, reject) => {
      this.eventBus.policyChange.subscribeOnce(() => {
        this.analyticsTimer.end(TimedEvent.JOIN);
        this.listener?.onJoin(room);
        resolve();
      });

      this.eventBus.leave.subscribeOnce(ex => {
        reject(ex);
      });
    });
  }

  /**
   * Init store and other managers, setup listeners, create local peer, room
   * @param {HMSConfig} config
   * @param {HMSPreviewListener} listener
   */
  private setUpPreview(config: HMSPreviewConfig, listener: HMSPreviewListener) {
    this.sdkState.isPreviewCalled = true;
    this.sdkState.isPreviewInProgress = true;
    const { roomId, userId, role } = decodeJWT(config.authToken);
    this.commonSetup(config, roomId, listener);
    this.store.setConfig(config);
    /** set after config since we need config to get env for user agent */
    this.store.createAndSetUserAgent(this.frameworkInfo);
    this.createAndAddLocalPeerToStore(config, role, userId, config.asRole);
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
        settings.maxBitrate = this.playlistSettings.audio?.bitrate || DEFAULT_PLAYLIST_AUDIO_BITRATE;
      } else {
        settings.maxBitrate = this.playlistSettings.video?.bitrate || DEFAULT_PLAYLIST_VIDEO_BITRATE;
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
  private createAndAddLocalPeerToStore(config: HMSConfig, role: string, userId: string, asRole?: string) {
    const policy = this.store.getPolicyForRole(role);
    const asRolePolicy = asRole ? this.store.getPolicyForRole(asRole) : undefined;
    const localPeer = new HMSLocalPeer({
      name: config.userName || '',
      customerUserId: userId,
      metadata: config.metaData || '',
      role: policy,
      // default value is the original role if user didn't pass asRole in config
      asRole: asRolePolicy || policy,
      type: HMSPeerType.REGULAR,
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

    this.initStoreAndManagers(listener);
    if (!this.store.getRoom()) {
      this.store.setRoom(new HMSRoom(roomId));
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
   * @param {function} onStop
   * @param config
   * @returns
   */
  private async getScreenshareTracks(onStop: () => void, config?: HMSScreenShareConfig) {
    const isOptimizedScreenShare = this.transport.isFlagEnabled(InitFlags.FLAG_SCALE_SCREENSHARE_BASED_ON_PIXELS);
    const [videoTrack, audioTrack] = await this.localTrackManager.getLocalScreen(config, isOptimizedScreenShare);

    const handleEnded = () => {
      this.stopEndedScreenshare(onStop);
    };

    const tracks = [];
    if (config?.audioOnly) {
      videoTrack.nativeTrack.stop();
      if (!audioTrack) {
        throw ErrorFactory.TracksErrors.NothingToReturn(
          HMSAction.TRACK,
          'Select share audio when sharing screen',
          'No audio found',
        );
      }
      tracks.push(audioTrack);
      audioTrack.nativeTrack.addEventListener('ended', handleEnded);
    } else {
      tracks.push(videoTrack);
      videoTrack.nativeTrack.addEventListener('ended', handleEnded);
      // audio track is not always available
      if (audioTrack) {
        tracks.push(audioTrack);
      }
    }
    return tracks;
  }

  private unpauseRemoteVideoTracks = () => {
    this.store.getRemoteVideoTracks().forEach(track => track.handleTrackUnmute());
  };

  private sendAudioPresenceFailed = () => {
    const error = ErrorFactory.TracksErrors.NoAudioDetected(HMSAction.PREVIEW);
    HMSLogger.w(this.TAG, 'Audio Presence Failure', this.transportState, error);
    // this.sendAnalyticsEvent(
    //   AnalyticsEventFactory.audioDetectionFail(error, this.deviceManager.getCurrentSelection().audioInput),
    // );
    if (this.isDiagnostics) {
      this.listener?.onError(error);
    }
  };

  private sendJoinAnalyticsEvent = (is_preview_called = false, error?: HMSException) => {
    this.eventBus.analytics.publish(
      AnalyticsEventFactory.join({
        error,
        ...this.analyticsTimer.getTimes(),
        time: this.analyticsTimer.getTimeTaken(TimedEvent.JOIN),
        is_preview_called,
        retries_join: this.transport.joinRetryCount,
      }),
    );
  };

  private sendPreviewAnalyticsEvent = (error?: HMSException) => {
    this.eventBus.analytics.publish(
      AnalyticsEventFactory.preview({
        error,
        ...this.analyticsTimer.getTimes(),
        time: this.analyticsTimer.getTimeTaken(TimedEvent.PREVIEW),
      }),
    );
  };

  private sendAnalyticsEvent = (event: AnalyticsEvent) => {
    // don't send analytics for diagnostics
    if (this.isDiagnostics) {
      return;
    }
    this.analyticsEventsService.queue(event).flush();
  };

  private stopPlaylist(track: HMSLocalTrack) {
    if (track.source === 'audioplaylist') {
      this.playlistManager.stop(HMSPlaylistType.audio);
    } else if (track.source === 'videoplaylist') {
      this.playlistManager.stop(HMSPlaylistType.video);
    }
  }

  // eslint-disable-next-line complexity
  private async applySettings(track: HMSLocalTrack) {
    validatePublishParams(this.store);
    const publishParams = this.store.getPublishParams();
    // this is not needed but added for avoiding ? later
    if (!publishParams) {
      return;
    }
    if (track instanceof HMSLocalVideoTrack) {
      const publishKey = track.source === 'regular' ? 'video' : track.source === 'screen' ? 'screen' : '';
      if (!publishKey || !publishParams.allowed.includes(publishKey)) {
        return;
      }
      const video = publishParams[publishKey];
      if (!video) {
        return;
      }
      const settings = new HMSVideoTrackSettingsBuilder()
        .codec(video.codec as HMSVideoCodec)
        .maxBitrate(video.bitRate)
        .maxFramerate(video.frameRate)
        .setWidth(video.width)
        .setHeight(video.height)
        .build();

      await track.setSettings(settings);
    } else if (track instanceof HMSLocalAudioTrack) {
      if (!publishParams.allowed.includes('audio')) {
        return;
      }
      const settings = new HMSAudioTrackSettingsBuilder()
        .codec(publishParams.audio.codec as HMSAudioCodec)
        .maxBitrate(publishParams.audio.bitRate)
        .build();
      await track.setSettings(settings);
    }
  }
}
