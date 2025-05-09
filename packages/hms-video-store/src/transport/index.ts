import { JoinParameters } from './models/JoinParameters';
import { TransportFailureCategory } from './models/TransportFailureCategory';
import { TransportState } from './models/TransportState';
import ITransportObserver from './ITransportObserver';
import { RetryScheduler } from './RetryScheduler';
import { AdditionalAnalyticsProperties } from '../analytics/AdditionalAnalyticsProperties';
import AnalyticsEvent from '../analytics/AnalyticsEvent';
import AnalyticsEventFactory from '../analytics/AnalyticsEventFactory';
import { AnalyticsEventsService } from '../analytics/AnalyticsEventsService';
import { AnalyticsTimer, TimedEvent } from '../analytics/AnalyticsTimer';
import { HTTPAnalyticsTransport } from '../analytics/HTTPAnalyticsTransport';
import { SignalAnalyticsTransport } from '../analytics/signal-transport/SignalAnalyticsTransport';
import { PublishStatsAnalytics, SubscribeStatsAnalytics } from '../analytics/stats';
import { PluginUsageTracker } from '../common/PluginUsageTracker';
import { HMSConnectionRole, HMSTrickle } from '../connection/model';
import { IPublishConnectionObserver } from '../connection/publish/IPublishConnectionObserver';
import HMSPublishConnection from '../connection/publish/publishConnection';
import ISubscribeConnectionObserver from '../connection/subscribe/ISubscribeConnectionObserver';
import HMSSubscribeConnection from '../connection/subscribe/subscribeConnection';
import { DeviceManager } from '../device-manager';
import { HMSDiagnosticsConnectivityListener } from '../diagnostics/interfaces';
import { ErrorCodes } from '../error/ErrorCodes';
import { ErrorFactory } from '../error/ErrorFactory';
import { HMSAction } from '../error/HMSAction';
import { HMSException } from '../error/HMSException';
import { EventBus } from '../events/EventBus';
import { HMSICEServer, HMSRole, HMSTrackUpdate, HMSUpdateListener } from '../interfaces';
import { HMSLocalStream } from '../media/streams/HMSLocalStream';
import { HMSLocalTrack, HMSLocalVideoTrack, HMSTrack } from '../media/tracks';
import { TrackState } from '../notification-manager';
import { HMSWebrtcInternals } from '../rtc-stats/HMSWebrtcInternals';
import { Store } from '../sdk/store';
import InitService from '../signal/init';
import { InitConfig, InitFlags } from '../signal/init/models';
import { ISignalEventsObserver } from '../signal/ISignalEventsObserver';
import JsonRpcSignal from '../signal/jsonrpc';
import {
  ICE_DISCONNECTION_TIMEOUT,
  LEAVE_REASON,
  PROTOCOL_SPEC,
  PROTOCOL_VERSION,
  PUBLISH_STATS_PUSH_INTERVAL,
  PUBLISH_STATS_SAMPLE_WINDOW,
  RENEGOTIATION_CALLBACK_ID,
  SUBSCRIBE_ICE_CONNECTION_CALLBACK_ID,
  SUBSCRIBE_STATS_PUSH_INTERVAL,
  SUBSCRIBE_STATS_SAMPLE_WINDOW,
  SUBSCRIBE_TIMEOUT,
} from '../utils/constants';
import HMSLogger from '../utils/logger';
import { getNetworkInfo } from '../utils/network-info';
import { PromiseCallbacks } from '../utils/promise';

const TAG = '[HMSTransport]:';

// @DISCUSS: action and extra are not used at all.
interface CallbackTriple {
  promise: PromiseCallbacks<boolean>;
  action: HMSAction;
  extra: any;
}

interface NegotiateJoinParams {
  name: string;
  data: string;
  autoSubscribeVideo: boolean;
}

export default class HMSTransport {
  private state: TransportState = TransportState.Disconnected;
  private trackStates: Map<string, TrackState> = new Map();
  private publishConnection: HMSPublishConnection | null = null;
  private subscribeConnection: HMSSubscribeConnection | null = null;
  private initConfig?: InitConfig;
  private endpoint!: string;
  private joinParameters?: JoinParameters;
  private retryScheduler: RetryScheduler;
  private webrtcInternals?: HMSWebrtcInternals;
  private publishStatsAnalytics?: PublishStatsAnalytics;
  private subscribeStatsAnalytics?: SubscribeStatsAnalytics;
  private maxSubscribeBitrate = 0;
  private connectivityListener?: HMSDiagnosticsConnectivityListener;
  private sfuNodeId?: string;
  joinRetryCount = 0;
  private publishDisconnectTimer = 0;
  private listener?: HMSUpdateListener;
  private onScreenshareStop = () => {};
  private screenStream = new Set<MediaStream>();

  constructor(
    private observer: ITransportObserver,
    private deviceManager: DeviceManager,
    private store: Store,
    private eventBus: EventBus,
    private analyticsEventsService: AnalyticsEventsService,
    private analyticsTimer: AnalyticsTimer,
    private pluginUsageTracker: PluginUsageTracker,
  ) {
    this.webrtcInternals = new HMSWebrtcInternals(this.store, this.eventBus);

    const onStateChange = async (state: TransportState, error?: HMSException) => {
      if (state !== this.state) {
        this.state = state;
        await this.observer.onStateChange(this.state, error);
      }
    };
    this.retryScheduler = new RetryScheduler(onStateChange, this.sendErrorAnalyticsEvent.bind(this));

    this.eventBus.statsUpdate.subscribe(stats => {
      const currentSubscribeBitrate = stats.getLocalPeerStats()?.subscribe?.bitrate || 0;
      this.maxSubscribeBitrate = Math.max(this.maxSubscribeBitrate, currentSubscribeBitrate);
    });

    this.eventBus.localAudioEnabled.subscribe(({ track, enabled }) => this.trackUpdate(track, enabled));
    this.eventBus.localVideoEnabled.subscribe(({ track, enabled }) => this.trackUpdate(track, enabled));
  }

  /**
   * Map of callbacks used to wait for an event to fire.
   * Used here for:
   *  1. publish/unpublish waits for [IPublishConnectionObserver.onRenegotiationNeeded] to complete
   */
  private readonly callbacks = new Map<string, CallbackTriple>();

  setListener = (listener: HMSUpdateListener) => {
    this.listener = listener;
  };

  setOnScreenshareStop = (onStop: () => void) => {
    this.onScreenshareStop = onStop;
  };

  getWebsocketEndpoint(): string | undefined {
    if (!this.initConfig) {
      return;
    }
    return this.initConfig.endpoint;
  }

  private signalObserver: ISignalEventsObserver = {
    // eslint-disable-next-line complexity
    onOffer: async (jsep: RTCSessionDescriptionInit & { sfu_node_id?: string }) => {
      try {
        if (!this.subscribeConnection) {
          return;
        }
        if (
          jsep.sfu_node_id &&
          this.subscribeConnection.sfuNodeId &&
          this.subscribeConnection.sfuNodeId !== jsep.sfu_node_id
        ) {
          HMSLogger.d(TAG, 'ignoring old offer');
          return;
        }
        await this.subscribeConnection.setRemoteDescription(jsep);
        HMSLogger.d(
          TAG,
          `[SUBSCRIBE] Adding ${this.subscribeConnection.candidates.length} ice-candidates`,
          this.subscribeConnection.candidates,
        );
        for (const candidate of this.subscribeConnection.candidates) {
          await this.subscribeConnection.addIceCandidate(candidate);
        }
        this.subscribeConnection.candidates.length = 0;
        const answer = await this.subscribeConnection.createAnswer();
        await this.subscribeConnection.setLocalDescription(answer);
        this.signal.answer(answer);
        HMSLogger.d(TAG, '[role=SUBSCRIBE] onOffer renegotiation DONE ✅');
      } catch (err) {
        HMSLogger.d(TAG, '[role=SUBSCRIBE] onOffer renegotiation FAILED ❌', err);
        this.state = TransportState.Failed;
        let ex: HMSException;
        if (err instanceof HMSException) {
          ex = err;
        } else {
          ex = ErrorFactory.GenericErrors.Unknown(HMSAction.SUBSCRIBE, (err as Error).message);
        }
        this.observer.onFailure(ex);
        this.eventBus.analytics.publish(AnalyticsEventFactory.subscribeFail(ex));
      }
    },

    onTrickle: async (trickle: HMSTrickle) => {
      const connection =
        trickle.target === HMSConnectionRole.Publish ? this.publishConnection : this.subscribeConnection;
      if (!connection?.remoteDescription) {
        // ICE candidates can't be added without any remote session description
        connection?.candidates.push(trickle.candidate);
      } else {
        await connection.addIceCandidate(trickle.candidate);
      }
    },

    onNotification: (message: any) => this.observer.onNotification(message),

    onServerError: async (error: HMSException) => {
      await this.observer.onStateChange(TransportState.Failed, error);
    },

    onFailure: (error: HMSException) => {
      // @DISCUSS: Should we remove this? Pong failure would have already scheduled signal retry.
      if (this.joinParameters) {
        this.retryScheduler.schedule({
          category: TransportFailureCategory.SignalDisconnect,
          error,
          task: this.retrySignalDisconnectTask,
          originalState: this.state,
        });
      }
    },

    onOffline: async (reason: string) => {
      HMSLogger.d(TAG, 'socket offline', TransportState[this.state]);
      try {
        if (this.state !== TransportState.Leaving && this.joinParameters) {
          this.retryScheduler.schedule({
            category: TransportFailureCategory.SignalDisconnect,
            error: ErrorFactory.WebSocketConnectionErrors.WebSocketConnectionLost(HMSAction.RECONNECT_SIGNAL, reason),
            task: this.retrySignalDisconnectTask,
            originalState: this.state,
          });
        }
      } catch (e) {
        console.error(e);
      }
    },

    // this is called when socket connection is successful
    onOnline: () => {
      HMSLogger.d(TAG, 'socket online', TransportState[this.state]);
      this.analyticsSignalTransport.flushFailedEvents(this.store.getLocalPeer()?.peerId);
    },
    // this is called when window.online event is triggered
    onNetworkOnline: () => {
      this.analyticsEventsService.flushFailedClientEvents();
    },
  };

  public readonly signal = new JsonRpcSignal(this.signalObserver);
  private analyticsSignalTransport = new SignalAnalyticsTransport(this.signal);

  private publishDtlsStateTimer = 0;
  private lastPublishDtlsState: RTCDtlsTransportState = 'new';

  getWebrtcInternals() {
    return this.webrtcInternals;
  }

  isFlagEnabled(flag: InitFlags) {
    const config = this.initConfig?.config;
    const flags = config?.enabledFlags || [];
    return flags.includes(flag);
  }

  setConnectivityListener(listener: HMSDiagnosticsConnectivityListener) {
    this.connectivityListener = listener;
  }

  async preview(
    token: string,
    endpoint: string,
    peerId: string,
    customData: { name: string; metaData: string },
    autoSubscribeVideo = false,
    iceServers?: HMSICEServer[],
  ): Promise<InitConfig | void> {
    const initConfig = await this.connect(token, endpoint, peerId, customData, autoSubscribeVideo, iceServers);
    this.state = TransportState.Preview;
    this.observer.onStateChange(this.state);
    return initConfig;
  }

  async join(
    authToken: string,
    peerId: string,
    customData: { name: string; metaData: string },
    initEndpoint: string,
    autoSubscribeVideo = false,
    iceServers?: HMSICEServer[],
  ): Promise<void> {
    HMSLogger.d(TAG, 'join: started ⏰');
    try {
      if (!this.signal.isConnected || !this.initConfig) {
        await this.connect(authToken, initEndpoint, peerId, customData, autoSubscribeVideo, iceServers);
      }

      this.validateNotDisconnected('connect');

      if (this.initConfig) {
        await this.waitForLocalRoleAvailability();
        await this.createConnectionsAndNegotiateJoin(customData, autoSubscribeVideo);
        this.initStatsAnalytics();

        HMSLogger.d(TAG, '✅ join: Negotiated over PUBLISH connection');
      }
    } catch (error) {
      HMSLogger.e(TAG, `join: failed ❌ [token=${authToken}]`, error);
      this.state = TransportState.Failed;
      const ex = error as HMSException;
      // set isTerminal to true if not already when error code is 500(internal biz server error)
      ex.isTerminal = ex.isTerminal || ex.code === 500;
      await this.observer.onStateChange(this.state, ex);
      throw ex;
    }

    HMSLogger.d(TAG, '✅ join: successful');
    this.state = TransportState.Joined;
    this.observer.onStateChange(this.state);
  }

  async connect(
    token: string,
    endpoint: string,
    peerId: string,
    customData: { name: string; metaData: string },
    autoSubscribeVideo = false,
    iceServers?: HMSICEServer[],
  ): Promise<InitConfig | void> {
    this.setTransportStateForConnect();
    this.joinParameters = new JoinParameters(
      token,
      peerId,
      customData.name,
      customData.metaData,
      endpoint,
      autoSubscribeVideo,
      iceServers,
    );
    try {
      const response = await this.internalConnect(token, endpoint, peerId, iceServers);
      return response;
    } catch (error) {
      const shouldRetry =
        error instanceof HMSException &&
        ([
          ErrorCodes.WebSocketConnectionErrors.WEBSOCKET_CONNECTION_LOST,
          ErrorCodes.WebSocketConnectionErrors.FAILED_TO_CONNECT,
          ErrorCodes.WebSocketConnectionErrors.ABNORMAL_CLOSE,
          ErrorCodes.APIErrors.ENDPOINT_UNREACHABLE,
        ].includes(error.code) ||
          error.code.toString().startsWith('5') ||
          error.code.toString().startsWith('429'));

      if (shouldRetry) {
        const task = async () => {
          await this.internalConnect(token, endpoint, peerId, iceServers);
          return Boolean(this.initConfig && this.initConfig.endpoint);
        };

        await this.retryScheduler.schedule({
          category: TransportFailureCategory.ConnectFailed,
          error,
          task,
          originalState: this.state,
          changeState: false,
        });
      } else {
        throw error;
      }
    }
  }

  async leave(notifyServer: boolean, reason = LEAVE_REASON.USER_REQUEST): Promise<void> {
    this.retryScheduler.reset();
    this.joinParameters = undefined;
    HMSLogger.d(TAG, 'leaving in transport');
    try {
      const usage = this.pluginUsageTracker.getPluginUsage('HMSKrispPlugin');
      if (usage) {
        this.eventBus.analytics.publish(AnalyticsEventFactory.getKrispUsage(usage));
      }
      this.state = TransportState.Leaving;
      this.publishStatsAnalytics?.stop();
      this.subscribeStatsAnalytics?.stop();
      this.webrtcInternals?.cleanup();
      this.clearPeerConnections();
      if (notifyServer) {
        try {
          this.signal.leave(reason);
          HMSLogger.d(TAG, 'signal leave done');
        } catch (err) {
          HMSLogger.w(TAG, 'failed to send leave on websocket to server', err);
        }
      }
      this.analyticsEventsService.flushFailedClientEvents();
      this.analyticsEventsService.reset();
      await this.signal.close();
    } catch (err) {
      this.eventBus.analytics.publish(AnalyticsEventFactory.disconnect(err as Error));
      HMSLogger.e(TAG, 'leave: FAILED ❌', err);
    } finally {
      this.state = TransportState.Disconnected;
      this.observer.onStateChange(this.state);
    }
  }

  handleLocalRoleUpdate = async ({ oldRole, newRole }: { oldRole: HMSRole; newRole: HMSRole }) => {
    const changedFromNonWebRTCToWebRTC = !this.doesRoleNeedWebRTC(oldRole) && this.doesRoleNeedWebRTC(newRole);
    if (!changedFromNonWebRTCToWebRTC) {
      return;
    }

    HMSLogger.d(
      TAG,
      'Local peer role updated to webrtc role, creating PeerConnections and performing inital publish negotiation ⏳',
    );
    this.createPeerConnections();
    await this.negotiateOnFirstPublish();
  };

  async publish(tracks: Array<HMSLocalTrack>): Promise<void> {
    for (const track of tracks) {
      try {
        await this.publishTrack(track);
        this.connectivityListener?.onMediaPublished(track);
      } catch (error) {
        this.eventBus.analytics.publish(
          AnalyticsEventFactory.publish({
            devices: this.deviceManager.getDevices(),
            error: error as Error,
          }),
        );
      }
    }
  }

  async unpublish(tracks: Array<HMSLocalTrack>): Promise<void> {
    for (const track of tracks) {
      await this.unpublishTrack(track);
    }
  }

  setSFUNodeId(id?: string) {
    this.signal.setSfuNodeId(id);
    if (!this.sfuNodeId) {
      this.sfuNodeId = id;
      this.publishConnection?.setSfuNodeId(id);
      this.subscribeConnection?.setSfuNodeId(id);
    } else if (id && this.sfuNodeId !== id) {
      this.sfuNodeId = id;
      this.handleSFUMigration();
    }
  }

  // eslint-disable-next-line complexity
  async handleSFUMigration() {
    HMSLogger.time('sfu migration');
    this.clearPeerConnections();
    const peers = this.store.getPeerMap();
    this.store.removeRemoteTracks();
    for (const peerId in peers) {
      const peer = peers[peerId];
      if (peer.isLocal) {
        continue;
      }
      peer.audioTrack = undefined;
      peer.videoTrack = undefined;
      peer.auxiliaryTracks = [];
    }

    const localPeer = this.store.getLocalPeer();
    if (!localPeer) {
      return;
    }
    this.createPeerConnections();
    this.trackStates.clear();
    await this.negotiateOnFirstPublish();
    const streamMap = new Map<string, HMSLocalStream>();
    if (localPeer.audioTrack) {
      const stream = localPeer.audioTrack.stream as HMSLocalStream;
      if (!streamMap.get(stream.id)) {
        streamMap.set(stream.id, new HMSLocalStream(new MediaStream()));
      }
      const newTrack = localPeer.audioTrack.clone(streamMap.get(stream.id)!);
      this.store.removeTrack(localPeer.audioTrack);
      localPeer.audioTrack.cleanup();
      await this.publishTrack(newTrack);
      localPeer.audioTrack = newTrack;
    }

    if (localPeer.videoTrack) {
      const stream = localPeer.videoTrack.stream as HMSLocalStream;
      if (!streamMap.get(stream.id)) {
        streamMap.set(stream.id, new HMSLocalStream(new MediaStream()));
      }
      this.store.removeTrack(localPeer.videoTrack);
      const newTrack = localPeer.videoTrack.clone(streamMap.get(stream.id)!);
      localPeer.videoTrack.cleanup();
      await this.publishTrack(newTrack);
      localPeer.videoTrack = newTrack;
    }

    const auxTracks = [];
    while (localPeer.auxiliaryTracks.length > 0) {
      const track = localPeer.auxiliaryTracks.shift();
      if (track) {
        const stream = track.stream as HMSLocalStream;
        if (!streamMap.get(stream.id)) {
          /**
           *  For screenshare, you need to clone the current stream only, cloning the track will not work otherwise, it will have all
           *  correct states but bytes sent and all other stats would be 0
           **/
          streamMap.set(
            stream.id,
            new HMSLocalStream(track.source === 'screen' ? stream.nativeStream.clone() : new MediaStream()),
          );
        }
        this.store.removeTrack(track);
        const newTrack = track.clone(streamMap.get(stream.id)!);
        if (newTrack.type === 'video' && newTrack.source === 'screen') {
          /**
           * Store all the stream so they can be stopped when screenshare stopped. Stopping before is not helping
           */
          this.screenStream.add(stream.nativeStream);
          this.screenStream.add(newTrack.stream.nativeStream);
          newTrack.nativeTrack.addEventListener('ended', this.onScreenshareStop);
        }
        track.cleanup();
        await this.publishTrack(newTrack);
        auxTracks.push(newTrack);
      }
    }
    localPeer.auxiliaryTracks = auxTracks;
    streamMap.clear();
    this.listener?.onSFUMigration?.();
    HMSLogger.timeEnd('sfu migration');
  }

  /**
   * TODO: check if track.publishedTrackId be used instead of the hack to match with track with same type and
   * source. The hack won't work if there are multiple tracks with same source and type.
   */
  trackUpdate(track: HMSLocalTrack, enabled: boolean) {
    const currentTrackStates = Array.from(this.trackStates.values());
    const originalTrackState = currentTrackStates.find(
      trackState => track.type === trackState.type && track.source === trackState.source,
    );
    /**
     * on call interruption, we just send disabled track update to biz to send to remote peers WITHOUT sending to the local peer
     * in this case, track.enabled would still be true which is why we are using the value from the localVideoEnabled event
     *  */
    if (originalTrackState) {
      const newTrackState = new TrackState({
        ...originalTrackState,
        mute: !enabled,
      });
      this.trackStates.set(originalTrackState.track_id, newTrackState);
      HMSLogger.d(TAG, 'Track Update', this.trackStates, track);
      this.signal.trackUpdate(new Map([[originalTrackState.track_id, newTrackState]]));
      const peer = this.store.getLocalPeer();
      // don't send update in case of call interruption
      if (peer && enabled === track.enabled) {
        this.listener?.onTrackUpdate(enabled ? HMSTrackUpdate.TRACK_UNMUTED : HMSTrackUpdate.TRACK_MUTED, track, peer);
      }
    }
  }

  private async publishTrack(track: HMSLocalTrack): Promise<void> {
    track.publishedTrackId = track.getTrackIDBeingSent();
    HMSLogger.d(
      TAG,
      `⏳ publishTrack: trackId=${track.trackId}, toPublishTrackId=${track.publishedTrackId}`,
      `${track}`,
    );
    this.trackStates.set(track.publishedTrackId, new TrackState(track));
    const p = new Promise<boolean>((resolve, reject) => {
      this.callbacks.set(RENEGOTIATION_CALLBACK_ID, {
        promise: { resolve, reject },
        action: HMSAction.PUBLISH,
        extra: {},
      });
    });
    const stream = track.stream as HMSLocalStream;
    stream.setConnection(this.publishConnection!);
    const simulcastLayers = this.store.getSimulcastLayers(track.source!);
    stream.addTransceiver(track, simulcastLayers);
    HMSLogger.time(`publish-${track.trackId}-${track.type}`);
    await p;
    HMSLogger.timeEnd(`publish-${track.trackId}-${track.type}`);
    // add track to store after publish
    this.store.addTrack(track);

    await stream
      .setMaxBitrateAndFramerate(track)
      .then(() => {
        HMSLogger.d(
          TAG,
          `Setting maxBitrate=${track.settings.maxBitrate} kpbs${
            track instanceof HMSLocalVideoTrack ? ` and maxFramerate=${track.settings.maxFramerate}` : ''
          } for ${track.source} ${track.type} ${track.trackId}`,
        );
      })
      .catch(error => HMSLogger.w(TAG, 'Failed setting maxBitrate and maxFramerate', error));

    track.isPublished = true;

    HMSLogger.d(TAG, `✅ publishTrack: trackId=${track.trackId}`, `${track}`, this.callbacks);
  }

  private async unpublishTrack(track: HMSLocalTrack): Promise<void> {
    HMSLogger.d(TAG, `⏳ unpublishTrack: trackId=${track.trackId}`, `${track}`);
    if (track.publishedTrackId && this.trackStates.has(track.publishedTrackId)) {
      this.trackStates.delete(track.publishedTrackId);
    } else {
      // TODO: hotfix to unpublish replaced video track id, solve it properly
      // it won't work when there are multiple regular video tracks, hmslocalvideotrack can store
      // the original initial track id for a proper fix
      const currentTrackStates = Array.from(this.trackStates.values());
      const originalTrackState = currentTrackStates.find(
        trackState => track.type === trackState.type && track.source === trackState.source,
      );
      if (originalTrackState) {
        this.trackStates.delete(originalTrackState.track_id);
      }
    }
    const p = new Promise<boolean>((resolve, reject) => {
      this.callbacks.set(RENEGOTIATION_CALLBACK_ID, {
        promise: { resolve, reject },
        action: HMSAction.UNPUBLISH,
        extra: {},
      });
    });
    const stream = track.stream as HMSLocalStream;
    stream.removeSender(track);
    await p;
    await track.cleanup();
    if (track.source === 'screen' && this.screenStream) {
      // stop older screenshare tracks to remove the screenshare banner
      this.screenStream.forEach(stream => {
        stream.getTracks().forEach(_track => {
          _track.stop();
        });
        this.screenStream.delete(stream);
      });
    }
    // remove track from store on unpublish
    this.store.removeTrack(track);
    HMSLogger.d(TAG, `✅ unpublishTrack: trackId=${track.trackId}`, this.callbacks);
  }

  private async clearPeerConnections() {
    clearTimeout(this.publishDtlsStateTimer);
    this.publishDtlsStateTimer = 0;
    clearTimeout(this.publishDisconnectTimer);
    this.publishDisconnectTimer = 0;
    this.lastPublishDtlsState = 'new';
    this.publishConnection?.close();
    this.subscribeConnection?.close();
    this.publishConnection = null;
    this.subscribeConnection = null;
  }

  private waitForLocalRoleAvailability() {
    if (this.store.hasRoleDetailsArrived()) {
      return;
    } else {
      return new Promise<void>(resolve => {
        this.eventBus.policyChange.subscribeOnce(() => resolve());
      });
    }
  }

  private async createConnectionsAndNegotiateJoin(
    customData: { name: string; metaData: string },
    autoSubscribeVideo = false,
  ) {
    const isWebRTC = this.doesLocalPeerNeedWebRTC();
    if (isWebRTC) {
      this.createPeerConnections();
    }

    this.analyticsTimer.start(TimedEvent.JOIN_RESPONSE);
    await this.negotiateJoinWithRetry({
      name: customData.name,
      data: customData.metaData,
      autoSubscribeVideo,
      isWebRTC,
    });
    this.analyticsTimer.end(TimedEvent.JOIN_RESPONSE);
  }

  private createPeerConnections() {
    const logConnectionState = (
      role: HMSConnectionRole,
      newState: RTCIceConnectionState | RTCPeerConnectionState,
      ice = false,
    ) => {
      const log = ['disconnected', 'failed'].includes(newState)
        ? HMSLogger.w.bind(HMSLogger)
        : HMSLogger.d.bind(HMSLogger);

      log(TAG, `${HMSConnectionRole[role]} ${ice ? 'ice' : ''} connection state change: ${newState}`);
    };
    if (this.initConfig) {
      const publishConnectionObserver: IPublishConnectionObserver = {
        onRenegotiationNeeded: async () => {
          await this.performPublishRenegotiation();
        },

        // eslint-disable-next-line complexity
        onDTLSTransportStateChange: (state?: RTCDtlsTransportState) => {
          const log = state === 'failed' ? HMSLogger.w.bind(HMSLogger) : HMSLogger.d.bind(HMSLogger);
          log(TAG, `Publisher on dtls transport state change: ${state}`);

          if (!state || this.lastPublishDtlsState === state) {
            return;
          }

          this.lastPublishDtlsState = state;
          if (this.publishDtlsStateTimer !== 0) {
            clearTimeout(this.publishDtlsStateTimer);
            this.publishDtlsStateTimer = 0;
          }

          if (state !== 'connecting' && state !== 'failed') {
            return;
          }

          const timeout = this.initConfig?.config?.dtlsStateTimeouts?.[state];
          if (!timeout || timeout <= 0) {
            return;
          }

          // if we're in connecting check again after timeout
          // hotfix: mitigate https://100ms.atlassian.net/browse/LIVE-1924
          this.publishDtlsStateTimer = window.setTimeout(() => {
            const newState = this.publishConnection?.nativeConnection.connectionState;
            if (newState && state && newState === state) {
              // stuck in either `connecting` or `failed` state for long time
              const err = ErrorFactory.WebrtcErrors.ICEFailure(
                HMSAction.PUBLISH,
                `DTLS transport state ${state} timeout:${timeout}ms`,
                true,
              );
              this.eventBus.analytics.publish(AnalyticsEventFactory.disconnect(err));
              this.observer.onFailure(err);
            }
          }, timeout);
        },

        onDTLSTransportError: (error: Error) => {
          HMSLogger.e(TAG, `onDTLSTransportError ${error.name} ${error.message}`, error);
          this.eventBus.analytics.publish(AnalyticsEventFactory.disconnect(error));
        },

        onIceConnectionChange: async (newState: RTCIceConnectionState) => {
          logConnectionState(HMSConnectionRole.Publish, newState, true);
        },

        onConnectionStateChange: async (newState: RTCPeerConnectionState) => {
          logConnectionState(HMSConnectionRole.Publish, newState, false);
          if (newState === 'new') {
            return;
          }

          if (newState === 'connected') {
            this.connectivityListener?.onICESuccess(true);
            this.publishConnection?.handleSelectedIceCandidatePairs();
          } else if (newState === 'failed') {
            await this.handleIceConnectionFailure(
              HMSConnectionRole.Publish,
              ErrorFactory.WebrtcErrors.ICEFailure(
                HMSAction.PUBLISH,
                `local candidate - ${this.publishConnection?.selectedCandidatePair?.local?.candidate}; remote candidate - ${this.publishConnection?.selectedCandidatePair?.remote?.candidate}`,
              ),
            );
          } else {
            this.publishDisconnectTimer = window.setTimeout(() => {
              if (this.publishConnection?.connectionState !== 'connected') {
                this.handleIceConnectionFailure(
                  HMSConnectionRole.Publish,
                  ErrorFactory.WebrtcErrors.ICEDisconnected(
                    HMSAction.PUBLISH,
                    `local candidate - ${this.publishConnection?.selectedCandidatePair?.local?.candidate}; remote candidate - ${this.publishConnection?.selectedCandidatePair?.remote?.candidate}`,
                  ),
                );
              }
            }, ICE_DISCONNECTION_TIMEOUT);
          }
        },

        onIceCandidate: candidate => {
          this.connectivityListener?.onICECandidate(candidate, true);
        },

        onSelectedCandidatePairChange: candidatePair => {
          this.connectivityListener?.onSelectedICECandidatePairChange(candidatePair, true);
        },
      };

      const subscribeConnectionObserver: ISubscribeConnectionObserver = {
        onApiChannelMessage: (message: string) => {
          this.observer.onNotification(JSON.parse(message));
        },

        onTrackAdd: (track: HMSTrack) => {
          HMSLogger.d(TAG, '[Subscribe] onTrackAdd', `${track}`);
          this.observer.onTrackAdd(track);
        },

        onTrackRemove: (track: HMSTrack) => {
          HMSLogger.d(TAG, '[Subscribe] onTrackRemove', `${track}`);
          this.observer.onTrackRemove(track);
        },

        onIceConnectionChange: async (newState: RTCIceConnectionState) => {
          logConnectionState(HMSConnectionRole.Subscribe, newState, true);

          if (newState === 'connected') {
            const callback = this.callbacks.get(SUBSCRIBE_ICE_CONNECTION_CALLBACK_ID);
            this.callbacks.delete(SUBSCRIBE_ICE_CONNECTION_CALLBACK_ID);

            this.connectivityListener?.onICESuccess(false);
            if (callback) {
              callback.promise.resolve(true);
            }
          }
        },

        onConnectionStateChange: async (newState: RTCPeerConnectionState) => {
          logConnectionState(HMSConnectionRole.Subscribe, newState, false);

          if (newState === 'failed') {
            await this.handleIceConnectionFailure(
              HMSConnectionRole.Subscribe,
              ErrorFactory.WebrtcErrors.ICEFailure(
                HMSAction.SUBSCRIBE,
                `local candidate - ${this.subscribeConnection?.selectedCandidatePair?.local?.candidate}; remote candidate - ${this.subscribeConnection?.selectedCandidatePair?.remote?.candidate}`,
              ),
            );
          } else if (newState === 'disconnected') {
            setTimeout(() => {
              if (this.subscribeConnection?.connectionState === 'disconnected') {
                this.handleIceConnectionFailure(
                  HMSConnectionRole.Subscribe,
                  ErrorFactory.WebrtcErrors.ICEDisconnected(
                    HMSAction.SUBSCRIBE,
                    `local candidate - ${this.subscribeConnection?.selectedCandidatePair?.local?.candidate}; remote candidate - ${this.subscribeConnection?.selectedCandidatePair?.remote?.candidate}`,
                  ),
                );
              }
            }, ICE_DISCONNECTION_TIMEOUT);
          } else if (newState === 'connected') {
            this.subscribeConnection?.handleSelectedIceCandidatePairs();
            const callback = this.callbacks.get(SUBSCRIBE_ICE_CONNECTION_CALLBACK_ID);
            this.callbacks.delete(SUBSCRIBE_ICE_CONNECTION_CALLBACK_ID);

            if (callback) {
              callback.promise.resolve(true);
            }
          }
        },

        onIceCandidate: candidate => {
          this.connectivityListener?.onICECandidate(candidate, false);
        },

        onSelectedCandidatePairChange: candidatePair => {
          this.connectivityListener?.onSelectedICECandidatePairChange(candidatePair, false);
        },
      };
      if (!this.publishConnection) {
        this.publishConnection = new HMSPublishConnection(
          this.signal,
          this.initConfig.rtcConfiguration,
          publishConnectionObserver,
        );
      }

      if (!this.subscribeConnection) {
        this.subscribeConnection = new HMSSubscribeConnection(
          this.signal,
          this.initConfig.rtcConfiguration,
          this.isFlagEnabled.bind(this),
          subscribeConnectionObserver,
        );
      }
    }

    this.webrtcInternals?.setPeerConnections({
      publish: this.publishConnection?.nativeConnection,
      subscribe: this.subscribeConnection?.nativeConnection,
    });
  }

  private async negotiateJoinWithRetry({
    name,
    data,
    autoSubscribeVideo,
    isWebRTC = true,
  }: NegotiateJoinParams & { isWebRTC: boolean }) {
    try {
      await this.negotiateJoin({ name, data, autoSubscribeVideo, isWebRTC });
    } catch (error) {
      HMSLogger.e(TAG, 'Join negotiation failed ❌', error);
      const hmsError =
        error instanceof HMSException
          ? error
          : ErrorFactory.WebsocketMethodErrors.ServerErrors(
              500,
              HMSAction.JOIN,
              `Websocket join error - ${(error as Error).message}`,
            );
      const shouldRetry =
        parseInt(`${hmsError.code / 100}`) === 5 ||
        [ErrorCodes.WebSocketConnectionErrors.WEBSOCKET_CONNECTION_LOST, 429].includes(hmsError.code);

      if (hmsError.code === 410) {
        hmsError.isTerminal = true;
      }

      if (shouldRetry) {
        this.joinRetryCount = 0;
        hmsError.isTerminal = false;
        const task = async () => {
          this.joinRetryCount++;
          return await this.negotiateJoin({ name, data, autoSubscribeVideo, isWebRTC });
        };

        await this.retryScheduler.schedule({
          category: TransportFailureCategory.JoinWSMessageFailed,
          error: hmsError,
          task,
          originalState: TransportState.Joined,
          changeState: false,
        });
      } else {
        throw error;
      }
    }
  }

  private async negotiateJoin({
    name,
    data,
    autoSubscribeVideo,
    isWebRTC = true,
  }: NegotiateJoinParams & { isWebRTC: boolean }): Promise<boolean> {
    if (isWebRTC) {
      return await this.negotiateJoinWebRTC({ name, data, autoSubscribeVideo });
    } else {
      return await this.negotiateJoinNonWebRTC({ name, data, autoSubscribeVideo });
    }
  }

  private async negotiateJoinWebRTC({ name, data, autoSubscribeVideo }: NegotiateJoinParams): Promise<boolean> {
    HMSLogger.d(TAG, '⏳ join: Negotiating over PUBLISH connection');
    if (!this.publishConnection) {
      HMSLogger.e(TAG, 'Publish peer connection not found, cannot negotiate');
      return false;
    }
    const offer = await this.publishConnection.createOffer();
    await this.publishConnection.setLocalDescription(offer);
    const serverSubDegrade = this.isFlagEnabled(InitFlags.FLAG_SERVER_SUB_DEGRADATION);
    const simulcast = this.isFlagEnabled(InitFlags.FLAG_SERVER_SIMULCAST);
    const onDemandTracks = this.isFlagEnabled(InitFlags.FLAG_ON_DEMAND_TRACKS);
    const answer = await this.signal.join(
      name,
      data,
      !autoSubscribeVideo,
      serverSubDegrade,
      simulcast,
      onDemandTracks,
      offer,
    );
    this.setSFUNodeId(answer?.sfu_node_id);
    await this.publishConnection.setRemoteDescription(answer);
    for (const candidate of this.publishConnection.candidates) {
      await this.publishConnection.addIceCandidate(candidate);
    }

    this.publishConnection.initAfterJoin();
    return !!answer;
  }

  private async negotiateJoinNonWebRTC({ name, data, autoSubscribeVideo }: NegotiateJoinParams): Promise<boolean> {
    HMSLogger.d(TAG, '⏳ join: Negotiating Non-WebRTC');
    const serverSubDegrade = this.isFlagEnabled(InitFlags.FLAG_SERVER_SUB_DEGRADATION);
    const simulcast = this.isFlagEnabled(InitFlags.FLAG_SERVER_SIMULCAST);
    const onDemandTracks = this.isFlagEnabled(InitFlags.FLAG_ON_DEMAND_TRACKS);
    const response = await this.signal.join(
      name,
      data,
      !autoSubscribeVideo,
      serverSubDegrade,
      simulcast,
      onDemandTracks,
    );
    this.setSFUNodeId(response?.sfu_node_id);
    return !!response;
  }

  /**
   * Negotiate on first publish after changing role from non-webrtc peer to webrtc peer by sending offer
   */
  private async negotiateOnFirstPublish() {
    HMSLogger.d(TAG, '⏳ Negotiating offer over PUBLISH connection');
    if (!this.publishConnection) {
      HMSLogger.e(TAG, 'Publish peer connection not found, cannot negotiate');
      return false;
    }
    try {
      const offer = await this.publishConnection.createOffer(this.trackStates);
      await this.publishConnection.setLocalDescription(offer);
      const answer = await this.signal.offer(offer, this.trackStates);
      await this.publishConnection.setRemoteDescription(answer);
      for (const candidate of this.publishConnection.candidates) {
        await this.publishConnection.addIceCandidate(candidate);
      }

      this.publishConnection.initAfterJoin();
      return !!answer;
    } catch (ex) {
      // resolve for now as this might happen during migration
      if (ex instanceof HMSException && ex.code === 421) {
        return true;
      }
      throw ex;
    }
  }

  private async performPublishRenegotiation(constraints?: RTCOfferOptions) {
    HMSLogger.d(TAG, `⏳ [role=PUBLISH] onRenegotiationNeeded START`, this.trackStates);
    const callback = this.callbacks.get(RENEGOTIATION_CALLBACK_ID);
    if (!callback) {
      HMSLogger.w(TAG, 'no callback found for renegotiation');
      return;
    }

    if (!this.publishConnection) {
      HMSLogger.e(TAG, 'Publish peer connection not found, cannot renegotiate');
      return;
    }

    try {
      const offer = await this.publishConnection.createOffer(this.trackStates, constraints);
      await this.publishConnection.setLocalDescription(offer);
      HMSLogger.time(`renegotiation-offer-exchange`);
      const answer = await this.signal.offer(offer, this.trackStates);
      this.callbacks.delete(RENEGOTIATION_CALLBACK_ID);
      HMSLogger.timeEnd(`renegotiation-offer-exchange`);
      await this.publishConnection.setRemoteDescription(answer);
      callback.promise.resolve(true);
      HMSLogger.d(TAG, `[role=PUBLISH] onRenegotiationNeeded DONE ✅`);
    } catch (err) {
      let ex: HMSException;
      if (err instanceof HMSException) {
        ex = err;
      } else {
        ex = ErrorFactory.GenericErrors.Unknown(HMSAction.PUBLISH, (err as Error).message);
      }

      // resolve for now as this might happen during migration
      if (ex.code === 421) {
        callback.promise.resolve(true);
      } else {
        callback.promise.reject(ex);
      }
      HMSLogger.d(TAG, `[role=PUBLISH] onRenegotiationNeeded FAILED ❌`);
    }
  }

  private async handleIceConnectionFailure(role: HMSConnectionRole, error: HMSException) {
    // ice retry is already in progress(from disconnect state)
    if (
      this.retryScheduler.isTaskInProgress(
        HMSConnectionRole.Publish
          ? TransportFailureCategory.PublishIceConnectionFailed
          : TransportFailureCategory.SubscribeIceConnectionFailed,
      )
    ) {
      return;
    }

    if (role === HMSConnectionRole.Publish) {
      this.retryScheduler.schedule({
        category: TransportFailureCategory.PublishIceConnectionFailed,
        error,
        task: this.retryPublishIceFailedTask,
        originalState: TransportState.Joined,
      });
    } else {
      this.retryScheduler.schedule({
        category: TransportFailureCategory.SubscribeIceConnectionFailed,
        error,
        task: this.retrySubscribeIceFailedTask,
        originalState: TransportState.Joined,
      });
    }
  }

  private async internalConnect(token: string, initEndpoint: string, peerId: string, iceServers?: HMSICEServer[]) {
    HMSLogger.d(TAG, 'connect: started ⏰');
    const connectRequestedAt = new Date();
    try {
      this.analyticsTimer.start(TimedEvent.INIT);
      this.initConfig = await InitService.fetchInitConfig({
        token,
        peerId,
        userAgent: this.store.getUserAgent(),
        initEndpoint,
        iceServers,
      });
      this.connectivityListener?.onInitSuccess(this.initConfig.endpoint);
      const room = this.store.getRoom();
      if (room) {
        room.effectsKey = this.initConfig.config.vb?.effectsKey;
        room.isEffectsEnabled = this.isFlagEnabled(InitFlags.FLAG_EFFECTS_SDK_ENABLED);
        room.disableNoneLayerRequest = this.isFlagEnabled(InitFlags.FLAG_DISABLE_NONE_LAYER_REQUEST);
        room.isVBEnabled = this.isFlagEnabled(InitFlags.FLAG_VB_ENABLED);
        room.isHipaaEnabled = this.isFlagEnabled(InitFlags.FLAG_HIPAA_ENABLED);
        room.isNoiseCancellationEnabled = this.isFlagEnabled(InitFlags.FLAG_NOISE_CANCELLATION);
      }
      this.analyticsTimer.end(TimedEvent.INIT);
      HTTPAnalyticsTransport.setWebsocketEndpoint(this.initConfig.endpoint);
      // if leave was called while init was going on, don't open websocket
      this.validateNotDisconnected('post init');
      await this.openSignal(token, peerId);
      this.observer.onConnected();
      this.connectivityListener?.onSignallingSuccess();
      this.store.setSimulcastEnabled(this.isFlagEnabled(InitFlags.FLAG_SERVER_SIMULCAST));
      HMSLogger.d(TAG, 'Adding Analytics Transport: JsonRpcSignal');
      this.analyticsEventsService.setTransport(this.analyticsSignalTransport);
      this.analyticsEventsService.flush();
      return this.initConfig;
    } catch (error) {
      if (this.state !== TransportState.Reconnecting) {
        this.eventBus.analytics.publish(
          AnalyticsEventFactory.connect(
            error as Error,
            this.getAdditionalAnalyticsProperties(),
            connectRequestedAt,
            new Date(),
            initEndpoint,
          ),
        );
      }
      HMSLogger.e(TAG, '❌ internal connect: failed', error);
      throw error;
    }
  }

  // leave could be called between any two async tasks, which would make
  // the state disconnected instead of connecting, throw error for those cases.
  private validateNotDisconnected(stage: string) {
    if (this.state === TransportState.Disconnected) {
      HMSLogger.w(TAG, 'aborting join as transport state is disconnected');
      throw ErrorFactory.GenericErrors.ValidationFailed(`leave called before join could complete - stage=${stage}`);
    }
  }

  private async openSignal(token: string, peerId: string) {
    if (!this.initConfig) {
      throw ErrorFactory.APIErrors.InitConfigNotAvailable(HMSAction.INIT, 'Init Config not found');
    }

    HMSLogger.d(TAG, '⏳ internal connect: connecting to ws endpoint', this.initConfig.endpoint);
    const url = new URL(this.initConfig.endpoint);
    url.searchParams.set('peer', peerId);
    url.searchParams.set('token', token);
    url.searchParams.set('user_agent_v2', this.store.getUserAgent());
    url.searchParams.set('protocol_version', PROTOCOL_VERSION);
    url.searchParams.set('protocol_spec', PROTOCOL_SPEC);

    this.endpoint = url.toString();
    this.analyticsTimer.start(TimedEvent.WEBSOCKET_CONNECT);
    await this.signal.open(this.endpoint);
    this.analyticsTimer.end(TimedEvent.WEBSOCKET_CONNECT);
    this.analyticsTimer.start(TimedEvent.ON_POLICY_CHANGE);
    this.analyticsTimer.start(TimedEvent.ROOM_STATE);
    HMSLogger.d(TAG, '✅ internal connect: connected to ws endpoint');
  }

  private initStatsAnalytics() {
    if (this.isFlagEnabled(InitFlags.FLAG_PUBLISH_STATS)) {
      this.publishStatsAnalytics = new PublishStatsAnalytics(
        this.store,
        this.eventBus,
        this.getValueFromInitConfig('publishStats', 'maxSampleWindowSize', PUBLISH_STATS_SAMPLE_WINDOW),
        this.getValueFromInitConfig('publishStats', 'maxSamplePushInterval', PUBLISH_STATS_PUSH_INTERVAL),
      );

      this.getWebrtcInternals()?.start();
    }

    if (this.isFlagEnabled(InitFlags.FLAG_SUBSCRIBE_STATS)) {
      this.subscribeStatsAnalytics = new SubscribeStatsAnalytics(
        this.store,
        this.eventBus,
        this.getValueFromInitConfig('subscribeStats', 'maxSampleWindowSize', SUBSCRIBE_STATS_SAMPLE_WINDOW),
        this.getValueFromInitConfig('subscribeStats', 'maxSamplePushInterval', SUBSCRIBE_STATS_PUSH_INTERVAL),
      );

      this.getWebrtcInternals()?.start();
    }
  }

  private getValueFromInitConfig(
    baseKey: 'publishStats' | 'subscribeStats',
    subKey: 'maxSampleWindowSize' | 'maxSamplePushInterval',
    defaultValue: number,
  ) {
    return this.initConfig?.config[baseKey]?.[subKey] || defaultValue;
  }

  /**
   * Role does not need WebRTC(peer connections to communicate to SFU) if it cannot publish or subscribe to anything
   * @returns boolean denoting if a peer cannot publish(video, audio or screen) and cannot subscribe to any role
   */
  private doesRoleNeedWebRTC(role: HMSRole) {
    if (!this.isFlagEnabled(InitFlags.FLAG_NON_WEBRTC_DISABLE_OFFER)) {
      return true;
    }

    const isPublishing = Boolean(role.publishParams.allowed && role.publishParams.allowed?.length > 0);
    const isSubscribing = Boolean(
      role.subscribeParams.subscribeToRoles && role.subscribeParams.subscribeToRoles?.length > 0,
    );

    return isPublishing || isSubscribing;
  }

  private doesLocalPeerNeedWebRTC() {
    const localRole = this.store.getLocalPeer()?.role;
    if (!localRole) {
      return true;
    }

    return this.doesRoleNeedWebRTC(localRole);
  }

  private retryPublishIceFailedTask = async () => {
    /**
     * Proceed with the retry even if the connection state is connected as the offer could have failed
     * which will cause missing tiles if it is not sent again.
     * Do iceRestart only if not connected
     */
    if (this.publishConnection) {
      const p = new Promise<boolean>((resolve, reject) => {
        this.callbacks.set(RENEGOTIATION_CALLBACK_ID, {
          promise: { resolve, reject },
          action: HMSAction.RESTART_ICE,
          extra: {},
        });
      });
      await this.performPublishRenegotiation({ iceRestart: this.publishConnection.connectionState !== 'connected' });
      await p;
    }

    return true;
  };

  private retrySubscribeIceFailedTask = async () => {
    if (this.subscribeConnection && this.subscribeConnection.connectionState !== 'connected') {
      const p = new Promise<boolean>((resolve, reject) => {
        // Use subscribe constant string
        this.callbacks.set(SUBSCRIBE_ICE_CONNECTION_CALLBACK_ID, {
          promise: { resolve, reject },
          action: HMSAction.RESTART_ICE,
          extra: {},
        });
      });

      const timeout = new Promise(resolve => {
        setTimeout(resolve, SUBSCRIBE_TIMEOUT, false);
      });

      return Promise.race([p, timeout]) as Promise<boolean>;
    }

    return true;
  };

  private retrySignalDisconnectTask = async () => {
    HMSLogger.d(TAG, 'retrySignalDisconnectTask', { signalConnected: this.signal.isConnected });
    // Check if ws is disconnected - otherwise if only publishIce fails
    // and ws connect is success then we don't need to reconnect to WebSocket
    if (!this.signal.isConnected) {
      await this.internalConnect(
        this.joinParameters!.authToken,
        this.joinParameters!.endpoint,
        this.joinParameters!.peerId,
        this.joinParameters!.iceServers,
      );
    }

    // Only retry publish failed task after joining the call - not needed in preview signal reconnect
    const ok = this.store.getRoom()?.joinedAt
      ? this.signal.isConnected && (await this.retryPublishIceFailedTask())
      : this.signal.isConnected;
    // Send track update to sync local track state changes during reconnection
    this.signal.trackUpdate(this.trackStates);

    return ok;
  };

  private setTransportStateForConnect() {
    if (this.state === TransportState.Failed) {
      this.state = TransportState.Disconnected;
    }

    if (this.state !== TransportState.Disconnected && this.state !== TransportState.Reconnecting) {
      throw ErrorFactory.WebsocketMethodErrors.AlreadyJoined(
        HMSAction.JOIN,
        `Cannot join a meeting in ${this.state} state`,
      );
    }

    if (this.state === TransportState.Disconnected) {
      this.state = TransportState.Connecting;
      this.observer.onStateChange(this.state);
    }
  }

  private sendErrorAnalyticsEvent(error: HMSException, category: TransportFailureCategory) {
    const additionalProps = this.getAdditionalAnalyticsProperties();
    let event: AnalyticsEvent;
    switch (category) {
      case TransportFailureCategory.ConnectFailed:
        event = AnalyticsEventFactory.connect(error, additionalProps);
        break;
      case TransportFailureCategory.SignalDisconnect:
        event = AnalyticsEventFactory.disconnect(error, additionalProps);
        break;
      case TransportFailureCategory.JoinWSMessageFailed:
        event = AnalyticsEventFactory.join({
          error,
          time: this.analyticsTimer.getTimeTaken(TimedEvent.JOIN),
          init_response_time: this.analyticsTimer.getTimeTaken(TimedEvent.INIT),
          ws_connect_time: this.analyticsTimer.getTimeTaken(TimedEvent.WEBSOCKET_CONNECT),
          on_policy_change_time: this.analyticsTimer.getTimeTaken(TimedEvent.ON_POLICY_CHANGE),
          local_audio_track_time: this.analyticsTimer.getTimeTaken(TimedEvent.LOCAL_AUDIO_TRACK),
          local_video_track_time: this.analyticsTimer.getTimeTaken(TimedEvent.LOCAL_VIDEO_TRACK),
          retries_join: this.joinRetryCount,
        });
        break;
      case TransportFailureCategory.PublishIceConnectionFailed:
        event = AnalyticsEventFactory.publish({ error });
        break;
      case TransportFailureCategory.SubscribeIceConnectionFailed:
        event = AnalyticsEventFactory.subscribeFail(error);
        break;
    }
    this.eventBus.analytics.publish(event!);
  }

  getSubscribeConnection() {
    return this.subscribeConnection;
  }

  getAdditionalAnalyticsProperties(): AdditionalAnalyticsProperties {
    const network_info = getNetworkInfo();
    const document_hidden = typeof document !== 'undefined' && document.hidden;
    const num_degraded_tracks = this.store.getRemoteVideoTracks().filter(track => track.degraded).length;
    const publishBitrate = this.getWebrtcInternals()?.getCurrentStats()?.getLocalPeerStats()?.publish?.bitrate;
    const subscribeBitrate = this.getWebrtcInternals()?.getCurrentStats()?.getLocalPeerStats()?.subscribe?.bitrate;

    return {
      network_info,
      document_hidden,
      num_degraded_tracks,
      bitrate: {
        publish: publishBitrate,
        subscribe: subscribeBitrate,
      },
      max_sub_bitrate: this.maxSubscribeBitrate,
      recent_pong_response_times: this.signal.getPongResponseTimes(),
      transport_state: this.state,
    };
  }
}
