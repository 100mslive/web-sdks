import ITransportObserver from './ITransportObserver';
import ITransport from './ITransport';
import HMSPublishConnection from '../connection/publish';
import HMSSubscribeConnection from '../connection/subscribe';
import InitService from '../signal/init';
import { ISignalEventsObserver } from '../signal/ISignalEventsObserver';
import JsonRpcSignal from '../signal/jsonrpc';
import { HMSConnectionRole, HMSTrickle } from '../connection/model';
import { IPublishConnectionObserver } from '../connection/publish/IPublishConnectionObserver';
import ISubscribeConnectionObserver from '../connection/subscribe/ISubscribeConnectionObserver';
import { HMSTrack, HMSLocalTrack } from '../media/tracks';
import { HMSException } from '../error/HMSException';
import { PromiseCallbacks } from '../utils/promise';
import {
  MAX_TRANSPORT_RETRIES,
  RENEGOTIATION_CALLBACK_ID,
  SUBSCRIBE_ICE_CONNECTION_CALLBACK_ID,
  SUBSCRIBE_TIMEOUT,
} from '../utils/constants';
import HMSLocalStream from '../media/streams/HMSLocalStream';
import HMSLogger from '../utils/logger';
import { HMSVideoTrackSettings, HMSAudioTrackSettings, HMSTrackSettings } from '../media/settings';
import { TrackState } from '../notification-manager';
import { TransportState } from './models/TransportState';
import { ErrorFactory, HMSAction } from '../error/ErrorFactory';
import AnalyticsEventFactory from '../analytics/AnalyticsEventFactory';
import { JoinParameters } from './models/JoinParameters';
import { InitConfig } from '../signal/init/models';
import { TransportFailureCategory } from './models/TransportFailureCategory';
import { RetryScheduler } from './RetryScheduler';
import { userAgent } from '../utils/support';
import { ErrorCodes } from '../error/ErrorCodes';
import { SignalAnalyticsTransport } from '../analytics/signal-transport/SignalAnalyticsTransport';
import { HMSPeer, HMSRoleChangeRequest, HLSConfig } from '../interfaces';
import { TrackDegradationController } from '../degradation';
import { IStore } from '../sdk/store';
import { DeviceManager } from '../device-manager';
import {
  HLSRequestParams,
  HLSVariant,
  MultiTrackUpdateRequestParams,
  TrackUpdateRequestParams,
} from '../signal/interfaces';
import Message from '../sdk/models/HMSMessage';
import { ISignal } from '../signal/ISignal';
import { RTMPRecordingConfig } from '../interfaces/rtmp-recording-config';
import { LocalTrackManager } from '../sdk/LocalTrackManager';
import { HMSWebrtcInternals } from '../rtc-stats/HMSWebrtcInternals';
import { EventBus } from '../events/EventBus';
import { AnalyticsEventsService } from '../analytics/AnalyticsEventsService';

const TAG = '[HMSTransport]:';

// @DISCUSS: action and extra are not used at all.
interface CallbackTriple {
  promise: PromiseCallbacks<boolean>;
  action: HMSAction;
  extra: any;
}

export default class HMSTransport implements ITransport {
  private state: TransportState = TransportState.Disconnected;
  private trackStates: Map<string, TrackState> = new Map();
  private publishConnection: HMSPublishConnection | null = null;
  private subscribeConnection: HMSSubscribeConnection | null = null;
  private initConfig?: InitConfig;
  private endpoint!: string;
  private joinParameters?: JoinParameters;
  private retryScheduler: RetryScheduler;
  private trackDegradationController?: TrackDegradationController;
  private webrtcInternals?: HMSWebrtcInternals;

  constructor(
    private observer: ITransportObserver,
    private deviceManager: DeviceManager,
    private store: IStore,
    private localTrackManager: LocalTrackManager,
    private eventBus: EventBus,
    private analyticsEventsService: AnalyticsEventsService,
  ) {
    this.webrtcInternals = new HMSWebrtcInternals(
      this.store,
      this.eventBus,
      this.publishConnection?.nativeConnection,
      this.subscribeConnection?.nativeConnection,
    );
    this.retryScheduler = new RetryScheduler(this.eventBus, async (state, error) => {
      if (state !== this.state) {
        this.state = state;
        await this.observer.onStateChange(this.state, error);
      }
    });
  }

  /**
   * Map of callbacks used to wait for an event to fire.
   * Used here for:
   *  1. publish/unpublish waits for [IPublishConnectionObserver.onRenegotiationNeeded] to complete
   */
  private readonly callbacks = new Map<string, CallbackTriple>();

  private signalObserver: ISignalEventsObserver = {
    onOffer: async (jsep: RTCSessionDescriptionInit) => {
      try {
        await this.subscribeConnection!.setRemoteDescription(jsep);
        HMSLogger.d(
          TAG,
          `[SUBSCRIBE] Adding ${this.subscribeConnection!.candidates.length} ice-candidates`,
          this.subscribeConnection!.candidates,
        );
        for (const candidate of this.subscribeConnection!.candidates) {
          await this.subscribeConnection!.addIceCandidate(candidate);
        }
        this.subscribeConnection!.candidates.length = 0;
        const answer = await this.subscribeConnection!.createAnswer();
        await this.subscribeConnection!.setLocalDescription(answer);
        this.signal.answer(answer);
        HMSLogger.d(TAG, '[role=SUBSCRIBE] onOffer renegotiation DONE ✅');
      } catch (err) {
        HMSLogger.d(TAG, '[role=SUBSCRIBE] onOffer renegotiation FAILED ❌');
        this.state = TransportState.Failed;
        let ex: HMSException;
        if (err instanceof HMSException) {
          ex = err;
        } else {
          ex = ErrorFactory.GenericErrors.Unknown(HMSAction.PUBLISH, (err as Error).message);
        }

        this.eventBus.analytics.publish(AnalyticsEventFactory.subscribeFail(ex));
        throw ex;
      }
    },

    onTrickle: async (trickle: HMSTrickle) => {
      const connection =
        trickle.target === HMSConnectionRole.Publish ? this.publishConnection! : this.subscribeConnection!;
      if (connection.remoteDescription === null) {
        // ICE candidates can't be added without any remote session description
        connection.candidates.push(trickle.candidate);
      } else {
        await connection.addIceCandidate(trickle.candidate);
      }
    },

    onNotification: (message: any) => this.observer.onNotification(message),

    onServerError: async (error: HMSException) => {
      await this.observer.onStateChange(TransportState.Failed, error);
    },

    onFailure: (exception: HMSException) => {
      // @DISCUSS: Should we remove this? Pong failure would have already scheduled signal retry.
      if (this.joinParameters) {
        this.retryScheduler.schedule(
          TransportFailureCategory.SignalDisconnect,
          exception,
          this.retrySignalDisconnectTask,
        );
      }
    },

    onOffline: async (reason: string) => {
      HMSLogger.d(TAG, 'socket offline', TransportState[this.state]);
      try {
        if (this.state !== TransportState.Leaving && this.joinParameters) {
          this.retryScheduler.schedule(
            TransportFailureCategory.SignalDisconnect,
            ErrorFactory.WebSocketConnectionErrors.WebSocketConnectionLost(HMSAction.RECONNECT_SIGNAL, reason),
            this.retrySignalDisconnectTask,
          );
        }
      } catch (e) {
        console.error(e);
      }
    },

    onOnline: () => {
      HMSLogger.d(TAG, 'socket online', TransportState[this.state]);
      this.analyticsSignalTransport.flushFailedEvents();
    },
  };

  private signal: ISignal = new JsonRpcSignal(this.signalObserver);
  private analyticsSignalTransport = new SignalAnalyticsTransport(this.signal);

  private publishConnectionObserver: IPublishConnectionObserver = {
    onRenegotiationNeeded: async () => {
      await this.performPublishRenegotiation();
    },

    onIceConnectionChange: async (newState: RTCIceConnectionState) => {
      HMSLogger.d('publisher ice connection state change, ', newState);

      // @TODO: Uncomment this and remove connectionstatechange
      if (newState === 'failed') {
        // await this.handleIceConnectionFailure(HMSConnectionRole.Publish);
      }
    },

    // @TODO(eswar): Remove this. Use iceconnectionstate change with interval and threshold.
    onConnectionStateChange: async (newState: RTCPeerConnectionState) => {
      HMSLogger.d('publisher connection state change, ', newState);

      if (newState === 'failed') {
        await this.handleIceConnectionFailure(HMSConnectionRole.Publish);
      }
    },
  };

  private subscribeConnectionObserver: ISubscribeConnectionObserver = {
    onApiChannelMessage: (message: string) => {
      this.observer.onNotification(JSON.parse(message));
    },

    onTrackAdd: (track: HMSTrack) => {
      HMSLogger.d(TAG, '[Subscribe] onTrackAdd', track);
      this.observer.onTrackAdd(track);
    },

    onTrackRemove: (track: HMSTrack) => {
      HMSLogger.d(TAG, '[Subscribe] onTrackRemove', track);
      this.observer.onTrackRemove(track);
    },

    onIceConnectionChange: async (newState: RTCIceConnectionState) => {
      HMSLogger.d('subscriber ice connection state change, ', newState);
      if (newState === 'failed') {
        // await this.handleIceConnectionFailure(HMSConnectionRole.Subscribe);
      }

      if (newState === 'connected') {
        const callback = this.callbacks.get(SUBSCRIBE_ICE_CONNECTION_CALLBACK_ID);
        this.callbacks.delete(SUBSCRIBE_ICE_CONNECTION_CALLBACK_ID);

        if (callback) {
          callback.promise.resolve(true);
        }
      }
    },

    // @TODO(eswar): Remove this. Use iceconnectionstate change with interval and threshold.
    onConnectionStateChange: async (newState: RTCPeerConnectionState) => {
      HMSLogger.d('subscriber connection state change, ', newState);
      if (newState === 'failed') {
        await this.handleIceConnectionFailure(HMSConnectionRole.Subscribe);
      }

      if (newState === 'connected') {
        const callback = this.callbacks.get(SUBSCRIBE_ICE_CONNECTION_CALLBACK_ID);
        this.callbacks.delete(SUBSCRIBE_ICE_CONNECTION_CALLBACK_ID);

        if (callback) {
          callback.promise.resolve(true);
        }
      }
    },
  };

  async getLocalScreen(
    videoSettings: HMSVideoTrackSettings,
    audioSettings: HMSAudioTrackSettings,
  ): Promise<Array<HMSLocalTrack>> {
    try {
      return await this.localTrackManager.getLocalScreen(videoSettings, audioSettings);
    } catch (error) {
      if (error instanceof HMSException) {
        this.eventBus.analytics.publish(
          AnalyticsEventFactory.publish({
            error,
            devices: this.deviceManager.getDevices(),
            settings: new HMSTrackSettings(videoSettings, audioSettings, false),
          }),
        );
      }
      throw error;
    }
  }

  getWebrtcInternals() {
    return this.webrtcInternals;
  }

  async join(
    authToken: string,
    peerId: string,
    customData: { name: string; metaData: string },
    initEndpoint = 'https://prod-init.100ms.live/init',
    autoSubscribeVideo = false,

    // TODO: set default to true on final release
    serverSubDegrade = false,
  ): Promise<void> {
    this.setTransportStateForJoin();
    this.joinParameters = new JoinParameters(
      authToken,
      peerId,
      customData.name,
      customData.metaData,
      initEndpoint,
      autoSubscribeVideo,
      serverSubDegrade,
    );

    HMSLogger.d(TAG, 'join: started ⏰');
    const joinRequestedAt = new Date();
    try {
      if (!this.signal.isConnected || !this.initConfig) {
        await this.connect(authToken, initEndpoint, peerId);
      }

      if (this.initConfig) {
        await this.connectionJoin(
          customData.name,
          customData.metaData,
          this.initConfig.rtcConfiguration,
          autoSubscribeVideo,
          serverSubDegrade,
        );
      }
    } catch (error) {
      HMSLogger.e(TAG, `join: failed ❌ [token=${authToken}]`, error);
      this.state = TransportState.Failed;
      if (error instanceof HMSException) {
        this.eventBus.analytics.publish(AnalyticsEventFactory.join(joinRequestedAt, new Date(), error));
      }
      const ex = error as HMSException;
      ex.isTerminal = ex.code === 500;
      await this.observer.onStateChange(this.state, ex);
      throw ex;
    }

    HMSLogger.d(TAG, '✅ join: successful');
    this.state = TransportState.Joined;
    this.observer.onStateChange(this.state);
  }

  async connect(token: string, endpoint: string, peerId: string) {
    try {
      return await this.internalConnect(token, endpoint, peerId);
    } catch (error) {
      const shouldRetry =
        error instanceof HMSException &&
        ([
          ErrorCodes.WebSocketConnectionErrors.WEBSOCKET_CONNECTION_LOST,
          ErrorCodes.InitAPIErrors.ENDPOINT_UNREACHABLE,
        ].includes(error.code) ||
          error.code.toString().startsWith('5') ||
          error.code.toString().startsWith('429'));

      if (shouldRetry) {
        const task = async () => {
          await this.internalConnect(token, endpoint, peerId);
          return Boolean(this.initConfig && this.initConfig.endpoint);
        };

        await this.retryScheduler.schedule(
          TransportFailureCategory.ConnectFailed,
          error as HMSException,
          task,
          MAX_TRANSPORT_RETRIES,
          false,
        );
      } else {
        throw error;
      }
    }
  }

  async leave(): Promise<void> {
    this.analyticsEventsService.removeTransport(this.analyticsSignalTransport);

    this.retryScheduler.reset();
    this.joinParameters = undefined;

    try {
      this.state = TransportState.Leaving;
      this.webrtcInternals?.cleanUp();
      this.trackDegradationController?.cleanUp();
      await this.publishConnection?.close();
      await this.subscribeConnection?.close();
      if (this.signal.isConnected) {
        this.signal.leave();
        await this.signal.close();
      }
    } catch (err) {
      if (err instanceof HMSException) {
        this.eventBus.analytics.publish(AnalyticsEventFactory.disconnect(err));
      }
      HMSLogger.e(TAG, 'leave: FAILED ❌', err);
    } finally {
      this.state = TransportState.Disconnected;
      this.observer.onStateChange(this.state);
    }
  }

  async publish(tracks: Array<HMSLocalTrack>): Promise<void> {
    for (const track of tracks) {
      try {
        await this.publishTrack(track);
      } catch (error) {
        if (error instanceof HMSException) {
          this.eventBus.analytics.publish(
            AnalyticsEventFactory.publish({
              devices: this.deviceManager.getDevices(),
              error,
            }),
          );
        }
      }
    }
  }

  async unpublish(tracks: Array<HMSLocalTrack>): Promise<void> {
    for (const track of tracks) {
      await this.unpublishTrack(track);
    }
  }

  async sendMessage(message: Message) {
    await this.signal.broadcast(message);
  }

  /**
   * TODO: check if track.publishedTrackId be used instead of the hack to match with track with same type and
   * source. The hack won't work if there are multiple tracks with same source and type.
   */
  trackUpdate(track: HMSLocalTrack) {
    const currentTrackStates = Array.from(this.trackStates.values());
    const originalTrackState = currentTrackStates.find(
      trackState => track.type === trackState.type && track.source === trackState.source,
    );
    if (originalTrackState) {
      const newTrackState = new TrackState({
        ...originalTrackState,
        mute: !track.enabled,
      });
      this.trackStates.set(originalTrackState.track_id, newTrackState);
      HMSLogger.d(TAG, 'Track Update', this.trackStates, track);
      this.signal.trackUpdate(new Map([[originalTrackState.track_id, newTrackState]]));
    }
  }

  async changeRole(forPeer: HMSPeer, toRole: string, force = false) {
    await this.signal.requestRoleChange({
      requested_for: forPeer.peerId,
      role: toRole,
      force,
    });
  }

  async acceptRoleChange(request: HMSRoleChangeRequest) {
    await this.signal.acceptRoleChangeRequest({ role: request.role.name, token: request.token });
  }

  async endRoom(lock: boolean, reason: string) {
    await this.signal.endRoom(lock, reason);
  }

  async removePeer(peerId: string, reason: string) {
    await this.signal.removePeer({ requested_for: peerId, reason });
  }

  async startRTMPOrRecording(params: RTMPRecordingConfig) {
    if (params.rtmpURLs?.length) {
      await this.signal.startRTMPOrRecording({
        meeting_url: params.meetingURL,
        record: params.record,
        rtmp_urls: params.rtmpURLs,
      });
    } else {
      await this.signal.startRTMPOrRecording({
        meeting_url: params.meetingURL,
        record: params.record,
      });
    }
  }

  async stopRTMPOrRecording() {
    await this.signal.stopRTMPAndRecording();
  }

  async startHLSStreaming(params: HLSConfig) {
    const hlsParams: HLSRequestParams = {
      variants: params.variants.map(variant => {
        const hlsVariant: HLSVariant = { meeting_url: variant.meetingURL };
        if (variant.metadata) {
          hlsVariant.metadata = variant.metadata;
        }
        return hlsVariant;
      }),
    };
    if (params.recording) {
      hlsParams.hls_recording = {
        single_file_per_layer: params.recording.singleFilePerLayer,
        hls_vod: params.recording.hlsVod,
      };
    }
    await this.signal.startHLSStreaming(hlsParams);
  }

  async stopHLSStreaming(params?: HLSConfig) {
    if (params) {
      const hlsParams: HLSRequestParams = {
        variants: params?.variants.map(variant => {
          const hlsVariant: HLSVariant = { meeting_url: variant.meetingURL };
          if (variant.metadata) {
            hlsVariant.metadata = variant.metadata;
          }
          return hlsVariant;
        }),
      };
      await this.signal.stopHLSStreaming(hlsParams);
    }
    await this.signal.stopHLSStreaming();
  }

  async changeName(name: string) {
    await this.signal.updatePeer({
      name: name,
    });
  }

  async changeMetadata(metadata: string) {
    await this.signal.updatePeer({
      data: metadata,
    });
  }

  async changeTrackState(trackUpdateRequest: TrackUpdateRequestParams) {
    await this.signal.requestTrackStateChange(trackUpdateRequest);
  }

  async changeMultiTrackState(trackUpdateRequest: MultiTrackUpdateRequestParams) {
    await this.signal.requestMultiTrackStateChange(trackUpdateRequest);
  }

  private async publishTrack(track: HMSLocalTrack): Promise<void> {
    track.publishedTrackId = track.nativeTrack.id;
    HMSLogger.d(TAG, `⏳ publishTrack: trackId=${track.trackId}, toPublishTrackId=${track.publishedTrackId}`, track);
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

    // @ts-ignore
    const maxBitrate = track.settings.maxBitrate;
    if (maxBitrate) {
      await stream
        .setMaxBitrate(maxBitrate, track)
        .then(() => {
          HMSLogger.d(TAG, `Setting maxBitrate for ${track.source} ${track.type} to ${maxBitrate} kpbs`);
        })
        .catch(error => HMSLogger.e(TAG, 'Failed setting maxBitrate', error));
    }

    HMSLogger.d(TAG, `✅ publishTrack: trackId=${track.trackId}`, track, this.callbacks);
  }

  private async unpublishTrack(track: HMSLocalTrack): Promise<void> {
    HMSLogger.d(TAG, `⏳ unpublishTrack: trackId=${track.trackId}`, track);
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
    // remove track from store on unpublish
    this.store.removeTrack(track.trackId);
    HMSLogger.d(TAG, `✅ unpublishTrack: trackId=${track.trackId}`, this.callbacks);
  }

  private async connectionJoin(
    name: string,
    data: string,
    config: RTCConfiguration,
    autoSubscribeVideo: boolean,
    serverSubDegrade: boolean,
    constraints: RTCOfferOptions = { offerToReceiveAudio: false, offerToReceiveVideo: false },
  ) {
    this.publishConnection = new HMSPublishConnection(this.signal, config, this.publishConnectionObserver, this);
    this.subscribeConnection = new HMSSubscribeConnection(
      this.signal,
      config,
      this.subscribeConnectionObserver,
      serverSubDegrade,
    );

    try {
      HMSLogger.d(TAG, '⏳ join: Negotiating over PUBLISH connection');
      const offer = await this.publishConnection!.createOffer(constraints, new Map());
      await this.publishConnection!.setLocalDescription(offer);
      const answer = await this.signal.join(name, data, offer, !autoSubscribeVideo, serverSubDegrade);
      await this.publishConnection!.setRemoteDescription(answer);
      for (const candidate of this.publishConnection!.candidates || []) {
        await this.publishConnection!.addIceCandidate(candidate);
      }

      this.publishConnection!.initAfterJoin();
      await this.initRtcStatsMonitor();
      HMSLogger.d(TAG, '✅ join: Negotiated over PUBLISH connection');
    } catch (error) {
      this.state = TransportState.Failed;
      throw error;
    }
  }

  private async performPublishRenegotiation(constraints?: RTCOfferOptions) {
    HMSLogger.d(TAG, `⏳ [role=PUBLISH] onRenegotiationNeeded START`, this.trackStates);
    const callback = this.callbacks.get(RENEGOTIATION_CALLBACK_ID);
    if (!callback) {
      return;
    }

    try {
      const offer = await this.publishConnection!.createOffer(constraints, this.trackStates);
      await this.publishConnection!.setLocalDescription(offer);
      HMSLogger.time(`renegotiation-offer-exchange`);
      const answer = await this.signal.offer(offer, this.trackStates);
      this.callbacks.delete(RENEGOTIATION_CALLBACK_ID);
      HMSLogger.timeEnd(`renegotiation-offer-exchange`);
      await this.publishConnection!.setRemoteDescription(answer);
      callback!.promise.resolve(true);
      HMSLogger.d(TAG, `[role=PUBLISH] onRenegotiationNeeded DONE ✅`);
    } catch (err) {
      let ex: HMSException;
      if (err instanceof HMSException) {
        ex = err;
      } else {
        ex = ErrorFactory.GenericErrors.Unknown(HMSAction.PUBLISH, (err as Error).message);
      }

      callback!.promise.reject(ex);
      HMSLogger.d(TAG, `[role=PUBLISH] onRenegotiationNeeded FAILED ❌`);
    }
  }

  private async handleIceConnectionFailure(role: HMSConnectionRole) {
    if (role === HMSConnectionRole.Publish) {
      this.retryScheduler.schedule(
        TransportFailureCategory.PublishIceConnectionFailed,
        ErrorFactory.WebrtcErrors.ICEFailure(HMSAction.PUBLISH),
        this.retryPublishIceFailedTask,
      );
    } else {
      this.retryScheduler.schedule(
        TransportFailureCategory.SubscribeIceConnectionFailed,
        ErrorFactory.WebrtcErrors.ICEFailure(HMSAction.SUBSCRIBE),
        this.retrySubscribeIceFailedTask,
        1,
      );
    }
  }

  private async internalConnect(token: string, endpoint: string, peerId: string) {
    HMSLogger.d(TAG, 'connect: started ⏰');
    const connectRequestedAt = new Date();
    try {
      this.initConfig = await InitService.fetchInitConfig(token, peerId, endpoint);
      await this.openSignal(token, peerId);
      HMSLogger.d(TAG, 'Adding Analytics Transport: JsonRpcSignal');
      this.analyticsEventsService.addTransport(this.analyticsSignalTransport);
      this.analyticsEventsService.flush();
    } catch (error) {
      if (error instanceof HMSException) {
        this.eventBus.analytics.publish(AnalyticsEventFactory.connect(error, connectRequestedAt, new Date(), endpoint));
      }
      HMSLogger.d(TAG, '❌ internal connect: failed', error);
      throw error;
    }
  }

  private async openSignal(token: string, peerId: string) {
    if (!this.initConfig) {
      throw ErrorFactory.WebSocketConnectionErrors.GenericConnect(HMSAction.INIT, 'Init Config not found');
    }

    HMSLogger.d(TAG, '⏳ internal connect: connecting to ws endpoint', this.initConfig.endpoint);
    const url = new URL(this.initConfig.endpoint);
    url.searchParams.set('peer', peerId);
    url.searchParams.set('token', token);
    url.searchParams.set('user_agent', userAgent);
    this.endpoint = url.toString();
    await this.signal.open(this.endpoint);
    HMSLogger.d(TAG, '✅ internal connect: connected to ws endpoint');
  }

  private async initRtcStatsMonitor() {
    this.webrtcInternals?.setPeerConnections({
      publish: this.publishConnection?.nativeConnection,
      subscribe: this.subscribeConnection?.nativeConnection,
    });

    // TODO: when server-side subscribe degradation is released, we can remove check on the client-side
    //  as server will check in policy if subscribe degradation enabled from dashboard
    if (this.store.getSubscribeDegradationParams()) {
      if (!this.joinParameters?.serverSubDegrade) {
        this.trackDegradationController = new TrackDegradationController(this.store, this.eventBus);
        this.eventBus.statsUpdate.subscribe(stats => {
          this.trackDegradationController?.handleRtcStatsChange(stats.getLocalPeerStats()?.subscribe?.packetsLost || 0);
        });
      }

      this.eventBus.trackDegraded.subscribe(track => {
        this.eventBus.analytics.publish(AnalyticsEventFactory.degradationStats(track, true));
        this.observer.onTrackDegrade(track);
      });
      this.eventBus.trackRestored.subscribe(track => {
        this.eventBus.analytics.publish(AnalyticsEventFactory.degradationStats(track, false));
        this.observer.onTrackRestore(track);
      });
    }
    await this.webrtcInternals?.start();
  }

  private retryPublishIceFailedTask = async () => {
    if (
      this.publishConnection!.iceConnectionState !== 'connected' ||
      this.publishConnection!.connectionState !== 'connected'
    ) {
      const p = new Promise<boolean>((resolve, reject) => {
        this.callbacks.set(RENEGOTIATION_CALLBACK_ID, {
          promise: { resolve, reject },
          action: HMSAction.RESTART_ICE,
          extra: {},
        });
      });
      await this.performPublishRenegotiation({ iceRestart: true });
      await p;
    }

    return true;
  };

  private retrySubscribeIceFailedTask = async () => {
    if (
      this.subscribeConnection!.iceConnectionState !== 'connected' ||
      this.subscribeConnection!.connectionState !== 'connected'
    ) {
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
    let ok = this.signal.isConnected;

    HMSLogger.d(TAG, 'retrySignalDisconnectTask', { signalConnected: this.signal.isConnected });
    // Check if ws is disconnected - otherwise if only publishIce fails
    // and ws connect is success then we don't need to reconnect to WebSocket
    if (!this.signal.isConnected) {
      try {
        await this.internalConnect(
          this.joinParameters!.authToken,
          this.joinParameters!.endpoint,
          this.joinParameters!.peerId,
        );
        ok = true;
      } catch (ex) {
        ok = false;
      }
    }

    ok = this.signal.isConnected && (await this.retryPublishIceFailedTask());
    // Send track update to sync local track state changes during reconnection
    this.signal.trackUpdate(this.trackStates);

    return ok;
  };

  private setTransportStateForJoin() {
    if (this.state === TransportState.Failed) {
      this.state = TransportState.Disconnected;
    }

    if (this.state !== TransportState.Disconnected && this.state !== TransportState.Reconnecting) {
      throw ErrorFactory.WebsocketMethodErrors.AlreadyJoined(HMSAction.JOIN, `Cannot join a meeting in ${this.state}`);
    }

    if (this.state === TransportState.Disconnected) {
      this.state = TransportState.Connecting;
      this.observer.onStateChange(this.state);
    }
  }
}
