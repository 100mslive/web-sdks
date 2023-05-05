import { JoinParameters } from './models/JoinParameters';
import { TransportFailureCategory } from './models/TransportFailureCategory';
import { TransportState } from './models/TransportState';
import ITransport from './ITransport';
import ITransportObserver from './ITransportObserver';
import { RetryScheduler } from './RetryScheduler';
import { AdditionalAnalyticsProperties } from '../analytics/AdditionalAnalyticsProperties';
import AnalyticsEvent from '../analytics/AnalyticsEvent';
import AnalyticsEventFactory from '../analytics/AnalyticsEventFactory';
import { AnalyticsEventsService } from '../analytics/AnalyticsEventsService';
import { AnalyticsTimer, TimedEvent } from '../analytics/AnalyticsTimer';
import { HTTPAnalyticsTransport } from '../analytics/HTTPAnalyticsTransport';
import { SignalAnalyticsTransport } from '../analytics/signal-transport/SignalAnalyticsTransport';
import { HMSConnectionRole, HMSTrickle } from '../connection/model';
import { IPublishConnectionObserver } from '../connection/publish/IPublishConnectionObserver';
import HMSPublishConnection from '../connection/publish/publishConnection';
import ISubscribeConnectionObserver from '../connection/subscribe/ISubscribeConnectionObserver';
import HMSSubscribeConnection from '../connection/subscribe/subscribeConnection';
import { DeviceManager } from '../device-manager';
import { ErrorCodes } from '../error/ErrorCodes';
import { ErrorFactory, HMSAction } from '../error/ErrorFactory';
import { HMSException } from '../error/HMSException';
import { EventBus } from '../events/EventBus';
import { HLSConfig, HLSTimedMetadata, HMSPeer, HMSRole, HMSRoleChangeRequest } from '../interfaces';
import { RTMPRecordingConfig } from '../interfaces/rtmp-recording-config';
import HMSLocalStream from '../media/streams/HMSLocalStream';
import { HMSLocalTrack, HMSLocalVideoTrack, HMSTrack } from '../media/tracks';
import { TrackState } from '../notification-manager';
import { HMSWebrtcInternals } from '../rtc-stats/HMSWebrtcInternals';
import Message from '../sdk/models/HMSMessage';
import { IStore } from '../sdk/store';
import InitService from '../signal/init';
import { InitConfig, InitFlags } from '../signal/init/models';
import {
  HLSRequestParams,
  HLSTimedMetadataParams,
  HLSVariant,
  MultiTrackUpdateRequestParams,
  SetSessionMetadataParams,
  StartRTMPOrRecordingRequestParams,
  TrackUpdateRequestParams,
} from '../signal/interfaces';
import { ISignal } from '../signal/ISignal';
import { ISignalEventsObserver } from '../signal/ISignalEventsObserver';
import JsonRpcSignal from '../signal/jsonrpc';
import {
  ICE_DISCONNECTION_TIMEOUT,
  MAX_TRANSPORT_RETRIES,
  RENEGOTIATION_CALLBACK_ID,
  SUBSCRIBE_ICE_CONNECTION_CALLBACK_ID,
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

export default class HMSTransport implements ITransport {
  private state: TransportState = TransportState.Disconnected;
  private trackStates: Map<string, TrackState> = new Map();
  private publishConnection: HMSPublishConnection | null = null;
  private subscribeConnection: HMSSubscribeConnection | null = null;
  private initConfig?: InitConfig;
  private endpoint!: string;
  private joinParameters?: JoinParameters;
  private retryScheduler: RetryScheduler;
  private webrtcInternals?: HMSWebrtcInternals;
  private maxSubscribeBitrate = 0;
  joinRetryCount = 0;

  constructor(
    private observer: ITransportObserver,
    private deviceManager: DeviceManager,
    private store: IStore,
    private eventBus: EventBus,
    private analyticsEventsService: AnalyticsEventsService,
    private analyticsTimer: AnalyticsTimer,
  ) {
    this.webrtcInternals = new HMSWebrtcInternals(
      this.store,
      this.eventBus,
      this.publishConnection?.nativeConnection,
      this.subscribeConnection?.nativeConnection,
    );

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

    this.eventBus.localAudioEnabled.subscribe(({ track }) => this.trackUpdate(track));
    this.eventBus.localVideoEnabled.subscribe(({ track }) => this.trackUpdate(track));
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
        if (!this.subscribeConnection) {
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
          ex = ErrorFactory.GenericErrors.Unknown(HMSAction.PUBLISH, (err as Error).message);
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

  private signal: ISignal = new JsonRpcSignal(this.signalObserver);
  private analyticsSignalTransport = new SignalAnalyticsTransport(this.signal);

  private publishConnectionObserver: IPublishConnectionObserver = {
    onRenegotiationNeeded: async () => {
      await this.performPublishRenegotiation();
    },

    onIceConnectionChange: async (newState: RTCIceConnectionState) => {
      const log = newState === 'disconnected' ? HMSLogger.w.bind(HMSLogger) : HMSLogger.d.bind(HMSLogger);
      log(TAG, `Publish ice connection state change: ${newState}`);

      // @TODO: Uncomment this and remove connectionstatechange
      if (newState === 'failed') {
        // await this.handleIceConnectionFailure(HMSConnectionRole.Publish);
      }
    },

    // @TODO(eswar): Remove this. Use iceconnectionstate change with interval and threshold.
    onConnectionStateChange: async (newState: RTCPeerConnectionState) => {
      const log = newState === 'disconnected' ? HMSLogger.w.bind(HMSLogger) : HMSLogger.d.bind(HMSLogger);
      log(TAG, `Publish connection state change: ${newState}`);

      if (newState === 'connected') {
        this.publishConnection?.logSelectedIceCandidatePairs();
      }

      if (newState === 'disconnected') {
        // if state stays disconnected for 5 seconds, retry
        setTimeout(() => {
          if (this.publishConnection?.connectionState === 'disconnected') {
            this.handleIceConnectionFailure(
              HMSConnectionRole.Publish,
              ErrorFactory.WebrtcErrors.ICEDisconnected(
                HMSAction.PUBLISH,
                `local candidate - ${this.publishConnection?.selectedCandidatePair?.local.candidate}; remote candidate - ${this.publishConnection?.selectedCandidatePair?.remote.candidate}`,
              ),
            );
          }
        }, ICE_DISCONNECTION_TIMEOUT);
      }

      if (newState === 'failed') {
        await this.handleIceConnectionFailure(
          HMSConnectionRole.Publish,
          ErrorFactory.WebrtcErrors.ICEFailure(
            HMSAction.PUBLISH,
            `local candidate - ${this.publishConnection?.selectedCandidatePair?.local.candidate}; remote candidate - ${this.publishConnection?.selectedCandidatePair?.remote.candidate}`,
          ),
        );
      }
    },
  };

  private subscribeConnectionObserver: ISubscribeConnectionObserver = {
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
      const log = newState === 'disconnected' ? HMSLogger.w.bind(HMSLogger) : HMSLogger.d.bind(HMSLogger);
      log(TAG, `Subscribe ice connection state change: ${newState}`);

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
      const log = newState === 'disconnected' ? HMSLogger.w.bind(HMSLogger) : HMSLogger.d.bind(HMSLogger);
      log(TAG, `Subscribe connection state change: ${newState}`);

      if (newState === 'failed') {
        await this.handleIceConnectionFailure(
          HMSConnectionRole.Subscribe,
          ErrorFactory.WebrtcErrors.ICEFailure(
            HMSAction.SUBSCRIBE,
            `local candidate - ${this.subscribeConnection?.selectedCandidatePair?.local.candidate}; remote candidate - ${this.subscribeConnection?.selectedCandidatePair?.remote.candidate}`,
          ),
        );
      }

      if (newState === 'disconnected') {
        setTimeout(() => {
          if (this.subscribeConnection?.connectionState === 'disconnected') {
            this.handleIceConnectionFailure(
              HMSConnectionRole.Subscribe,
              ErrorFactory.WebrtcErrors.ICEDisconnected(
                HMSAction.SUBSCRIBE,
                `local candidate - ${this.subscribeConnection?.selectedCandidatePair?.local.candidate}; remote candidate - ${this.subscribeConnection?.selectedCandidatePair?.remote.candidate}`,
              ),
            );
          }
        }, ICE_DISCONNECTION_TIMEOUT);
      }

      if (newState === 'connected') {
        this.handleSubscribeConnectionConnected();
      }
    },
  };

  getWebrtcInternals() {
    return this.webrtcInternals;
  }

  isFlagEnabled(flag: InitFlags) {
    const config = this.initConfig?.config;
    const flags = config?.enabledFlags || [];
    return flags.includes(flag);
  }

  async preview(
    token: string,
    endpoint: string,
    peerId: string,
    customData: { name: string; metaData: string },
    autoSubscribeVideo = false,
  ): Promise<InitConfig | void> {
    const initConfig = await this.connect(token, endpoint, peerId, customData, autoSubscribeVideo);
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
  ): Promise<void> {
    HMSLogger.d(TAG, 'join: started ⏰');
    try {
      if (!this.signal.isConnected || !this.initConfig) {
        await this.connect(authToken, initEndpoint, peerId, customData, autoSubscribeVideo);
      }

      this.validateNotDisconnected('connect');

      if (this.initConfig) {
        await this.waitForLocalRoleAvailability();
        await this.createConnectionsAndNegotiateJoin(customData, autoSubscribeVideo);
        await this.initRtcStatsMonitor();

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

    HMSLogger.i(TAG, '✅ join: successful');
    this.state = TransportState.Joined;
    this.observer.onStateChange(this.state);
  }

  async connect(
    token: string,
    endpoint: string,
    peerId: string,
    customData: { name: string; metaData: string },
    autoSubscribeVideo = false,
  ): Promise<InitConfig | void> {
    this.setTransportStateForConnect();
    this.joinParameters = new JoinParameters(
      token,
      peerId,
      customData.name,
      customData.metaData,
      endpoint,
      autoSubscribeVideo,
    );
    try {
      const response = await this.internalConnect(token, endpoint, peerId);
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
          await this.internalConnect(token, endpoint, peerId);
          return Boolean(this.initConfig && this.initConfig.endpoint);
        };

        await this.retryScheduler.schedule({
          category: TransportFailureCategory.ConnectFailed,
          error,
          task,
          originalState: this.state,
          maxFailedRetries: MAX_TRANSPORT_RETRIES,
          changeState: false,
        });
      } else {
        throw error;
      }
    }
  }

  async leave(notifyServer: boolean): Promise<void> {
    this.retryScheduler.reset();
    this.joinParameters = undefined;
    HMSLogger.d(TAG, 'leaving in transport');
    try {
      this.state = TransportState.Leaving;
      this.webrtcInternals?.cleanUp();
      await this.publishConnection?.close();
      await this.subscribeConnection?.close();
      if (notifyServer) {
        try {
          this.signal.leave();
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

  async sendMessage(message: Message) {
    return await this.signal.broadcast(message);
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

  async changeRoleOfPeer(forPeer: HMSPeer, toRole: string, force: boolean) {
    await this.signal.requestRoleChange({
      requested_for: forPeer.peerId,
      role: toRole,
      force,
    });
  }

  async changeRoleOfPeersWithRoles(roles: HMSRole[], toRole: string) {
    await this.signal.requestBulkRoleChange({
      roles: roles.map((role: HMSRole) => role.name),
      role: toRole,
      force: true,
    });
  }

  async acceptRoleChange(request: HMSRoleChangeRequest) {
    await this.signal.acceptRoleChangeRequest({
      requested_by: request.requestedBy?.peerId,
      role: request.role.name,
      token: request.token,
    });
  }

  async endRoom(lock: boolean, reason: string) {
    await this.signal.endRoom(lock, reason);
  }

  async removePeer(peerId: string, reason: string) {
    await this.signal.removePeer({ requested_for: peerId, reason });
  }

  async startRTMPOrRecording(params: RTMPRecordingConfig) {
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

    await this.signal.startRTMPOrRecording(signalParams);
  }

  async stopRTMPOrRecording() {
    await this.signal.stopRTMPAndRecording();
  }

  async startHLSStreaming(params?: HLSConfig) {
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
    await this.signal.startHLSStreaming(hlsParams);
  }

  async stopHLSStreaming(params?: HLSConfig) {
    if (params) {
      const hlsParams: HLSRequestParams = {
        variants: params?.variants?.map(variant => {
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

  async sendHLSTimedMetadata(metadataList: HLSTimedMetadata[]) {
    if (metadataList.length > 0) {
      const hlsMtParams: HLSTimedMetadataParams = {
        metadata_objs: metadataList,
      };

      await this.signal.sendHLSTimedMetadata(hlsMtParams);
    }
  }
  async changeName(name: string) {
    const peer = this.store.getLocalPeer();
    if (peer && peer.name !== name) {
      await this.signal.updatePeer({
        name: name,
      });
    }
  }

  async changeMetadata(metadata: string) {
    await this.signal.updatePeer({
      data: metadata,
    });
  }

  getSessionMetadata(key?: string) {
    return this.signal.getSessionMetadata(key);
  }

  setSessionMetadata(params: SetSessionMetadataParams) {
    return this.signal.setSessionMetadata(params);
  }

  listenMetadataChange(keys: string[]): Promise<void> {
    return this.signal.listenMetadataChange(keys);
  }

  async changeTrackState(trackUpdateRequest: TrackUpdateRequestParams) {
    await this.signal.requestTrackStateChange(trackUpdateRequest);
  }

  async changeMultiTrackState(trackUpdateRequest: MultiTrackUpdateRequestParams) {
    await this.signal.requestMultiTrackStateChange(trackUpdateRequest);
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
    // remove track from store on unpublish
    this.store.removeTrack(track);
    HMSLogger.d(TAG, `✅ unpublishTrack: trackId=${track.trackId}`, this.callbacks);
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
    if (this.initConfig) {
      if (!this.publishConnection) {
        this.publishConnection = new HMSPublishConnection(
          this.signal,
          this.initConfig.rtcConfiguration,
          this.publishConnectionObserver,
        );
      }

      if (!this.subscribeConnection) {
        this.subscribeConnection = new HMSSubscribeConnection(
          this.signal,
          this.initConfig.rtcConfiguration,
          this.subscribeConnectionObserver,
        );
      }
    }
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
          maxFailedRetries: 3,
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
    const answer = await this.signal.join(name, data, !autoSubscribeVideo, serverSubDegrade, simulcast, offer);
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
    const response = await this.signal.join(name, data, !autoSubscribeVideo, serverSubDegrade, simulcast);
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
    const offer = await this.publishConnection.createOffer(this.trackStates);
    await this.publishConnection.setLocalDescription(offer);
    const answer = await this.signal.offer(offer, this.trackStates);
    await this.publishConnection.setRemoteDescription(answer);
    for (const candidate of this.publishConnection.candidates) {
      await this.publishConnection.addIceCandidate(candidate);
    }

    this.publishConnection.initAfterJoin();
    return !!answer;
  }

  private async performPublishRenegotiation(constraints?: RTCOfferOptions) {
    HMSLogger.d(TAG, `⏳ [role=PUBLISH] onRenegotiationNeeded START`, this.trackStates);
    const callback = this.callbacks.get(RENEGOTIATION_CALLBACK_ID);
    if (!callback) {
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

      callback!.promise.reject(ex);
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
        maxFailedRetries: 1,
      });
    }
  }

  private async internalConnect(token: string, initEndpoint: string, peerId: string) {
    HMSLogger.d(TAG, 'connect: started ⏰');
    const connectRequestedAt = new Date();
    try {
      this.analyticsTimer.start(TimedEvent.INIT);
      this.initConfig = await InitService.fetchInitConfig({
        token,
        peerId,
        userAgent: this.store.getUserAgent(),
        initEndpoint,
      });
      this.analyticsTimer.end(TimedEvent.INIT);
      HTTPAnalyticsTransport.setWebsocketEndpoint(this.initConfig.endpoint);
      // if leave was called while init was going on, don't open websocket
      this.validateNotDisconnected('post init');
      await this.openSignal(token, peerId);
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
    this.endpoint = url.toString();
    this.analyticsTimer.start(TimedEvent.WEBSOCKET_CONNECT);
    await this.signal.open(this.endpoint);
    this.analyticsTimer.end(TimedEvent.WEBSOCKET_CONNECT);
    this.analyticsTimer.start(TimedEvent.ON_POLICY_CHANGE);
    this.analyticsTimer.start(TimedEvent.ROOM_STATE);
    HMSLogger.d(TAG, '✅ internal connect: connected to ws endpoint');
  }

  private async initRtcStatsMonitor() {
    this.webrtcInternals?.setPeerConnections({
      publish: this.publishConnection?.nativeConnection,
      subscribe: this.subscribeConnection?.nativeConnection,
    });
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

  private handleSubscribeConnectionConnected() {
    this.subscribeConnection?.logSelectedIceCandidatePairs();
    const callback = this.callbacks.get(SUBSCRIBE_ICE_CONNECTION_CALLBACK_ID);
    this.callbacks.delete(SUBSCRIBE_ICE_CONNECTION_CALLBACK_ID);

    if (callback) {
      callback.promise.resolve(true);
    }
  }

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
