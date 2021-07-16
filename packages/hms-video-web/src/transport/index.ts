import ITransportObserver from './ITransportObserver';
import ITransport, { IFetchAVTrackOptions } from './ITransport';
import HMSPublishConnection from '../connection/publish';
import HMSSubscribeConnection from '../connection/subscribe';
import InitService from '../signal/init';
import { ISignal } from '../signal/ISignal';
import { ISignalEventsObserver } from '../signal/ISignalEventsObserver';
import JsonRpcSignal from '../signal/jsonrpc';
import { HMSConnectionRole, HMSTrickle } from '../connection/model';
import { IPublishConnectionObserver } from '../connection/publish/IPublishConnectionObserver';
import ISubscribeConnectionObserver from '../connection/subscribe/ISubscribeConnectionObserver';
import { HMSTrack } from '../media/tracks/HMSTrack';
import { HMSException } from '../error/HMSException';
import { PromiseCallbacks } from '../utils/promise';
import {
  MAX_TRANSPORT_RETRIES,
  RENEGOTIATION_CALLBACK_ID,
  SUBSCRIBE_ICE_CONNECTION_CALLBACK_ID,
  SUBSCRIBE_TIMEOUT,
} from '../utils/constants';
import HMSLocalStream, { HMSLocalTrack } from '../media/streams/HMSLocalStream';
import HMSLogger from '../utils/logger';
import { HMSVideoTrackSettings, HMSAudioTrackSettings, HMSTrackSettings } from '../media/settings';
import { HMSMessage } from '../interfaces/message';
import { TrackState } from '../sdk/models/HMSNotifications';
import { TransportState } from './models/TransportState';
import { ErrorFactory, HMSAction } from '../error/ErrorFactory';
import analyticsEventsService from '../analytics/AnalyticsEventsService';
import AnalyticsEventFactory from '../analytics/AnalyticsEventFactory';
import { JoinParameters } from './models/JoinParameters';
import { InitConfig } from '../signal/init/models';
import { TransportFailureCategory } from './models/TransportFailureCategory';
import { RetryScheduler } from './RetryScheduler';
import { userAgent } from '../utils/support';
import { ErrorCodes } from '../error/ErrorCodes';
import { SignalAnalyticsTransport } from '../analytics/signal-transport/SignalAnalyticsTransport';
import { IStore } from '../sdk/store/IStore';
import DeviceManager from '../sdk/models/DeviceManager';

const TAG = '[HMSTransport]:';

interface CallbackTriple {
  promise: PromiseCallbacks<boolean>;
  action: HMSAction;
  extra: any;
}

export default class HMSTransport implements ITransport {
  private state: TransportState = TransportState.Disconnected;
  private tracks: Map<string, TrackState> = new Map();
  private readonly observer: ITransportObserver;
  private publishConnection: HMSPublishConnection | null = null;
  private subscribeConnection: HMSSubscribeConnection | null = null;
  private initConfig?: InitConfig;
  private endpoint!: string;
  private joinParameters?: JoinParameters;
  private retryScheduler = new RetryScheduler(analyticsEventsService, async (state, error) => {
    if (state !== this.state) {
      this.state = state;
      await this.observer.onStateChange(this.state, error);
    }
  });

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
          ex = ErrorFactory.GenericErrors.Unknown(HMSAction.PUBLISH, err.message);
        }

        analyticsEventsService.queue(AnalyticsEventFactory.subscribeFail(ex)).flush();
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

    onNotification: (message: Object) => this.observer.onNotification(message),

    onServerError: async (error: HMSException) => {
      await this.leave();
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

    onOffline: async () => {
      HMSLogger.d(TAG, 'socket offline', TransportState[this.state]);
      try {
        if (this.state !== TransportState.Leaving && this.joinParameters) {
          this.retryScheduler.schedule(
            TransportFailureCategory.SignalDisconnect,
            ErrorFactory.WebSocketConnectionErrors.WebSocketConnectionLost(HMSAction.INIT, 'Network offline'),
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

  constructor(observer: ITransportObserver, private deviceManager: DeviceManager, private store: IStore) {
    this.observer = observer;
  }

  async getLocalScreen(
    videoSettings: HMSVideoTrackSettings,
    audioSettings: HMSAudioTrackSettings,
  ): Promise<Array<HMSLocalTrack>> {
    try {
      return await HMSLocalStream.getLocalScreen(videoSettings, audioSettings);
    } catch (error) {
      if (error instanceof HMSException) {
        analyticsEventsService
          .queue(
            AnalyticsEventFactory.publishFail({
              error,
              devices: this.deviceManager.getDevices(),
              settings: new HMSTrackSettings(videoSettings, audioSettings, false),
            }),
          )
          .flush();
      }
      throw error;
    }
  }

  async getLocalTracks(settings: HMSTrackSettings): Promise<Array<HMSLocalTrack>> {
    try {
      return await HMSLocalStream.getLocalTracks(settings);
    } catch (error) {
      if (error instanceof HMSException) {
        analyticsEventsService
          .queue(
            AnalyticsEventFactory.publishFail({
              devices: this.deviceManager.getDevices(),
              error,
              settings,
            }),
          )
          .flush();
      }
      throw error;
    }
  }

  async getEmptyLocalTracks(
    fetchTrackOptions: IFetchAVTrackOptions = { audio: true, video: true },
    settings?: HMSTrackSettings,
  ): Promise<Array<HMSLocalTrack>> {
    try {
      const tracks = await HMSLocalStream.getEmptyLocalTracks(fetchTrackOptions, settings);
      analyticsEventsService.queue(AnalyticsEventFactory.publish(this.deviceManager.getDevices(), settings)).flush();
      return tracks;
    } catch (error) {
      if (error instanceof HMSException) {
        analyticsEventsService
          .queue(
            AnalyticsEventFactory.publishFail({
              devices: this.deviceManager.getDevices(),
              error,
              settings,
            }),
          )
          .flush();
      }
      throw error;
    }
  }

  async join(
    authToken: string,
    peerId: string,
    customData: { name: string; metaData: string },
    initEndpoint: string = 'https://prod-init.100ms.live/init',
    autoSubscribeVideo: boolean = false,
  ): Promise<void> {
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

    this.joinParameters = new JoinParameters(
      authToken,
      peerId,
      customData.name,
      customData.metaData,
      initEndpoint,
      autoSubscribeVideo,
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
        );
      }
    } catch (error) {
      HMSLogger.e(TAG, 'join: failed ❌ [token=$authToken]', error);
      this.state = TransportState.Failed;
      if (error instanceof HMSException) {
        analyticsEventsService.queue(AnalyticsEventFactory.join(joinRequestedAt, new Date(), error)).flush();
      }
      await this.observer.onStateChange(this.state, error);
      throw error;
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
          ErrorCodes.InitAPIErrors.CONNECTION_LOST,
          ErrorCodes.InitAPIErrors.HTTP_ERROR,
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
          error,
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
    analyticsEventsService.queue(AnalyticsEventFactory.leave()).flush();
    analyticsEventsService.removeTransport(this.analyticsSignalTransport);

    this.retryScheduler.reset();
    this.joinParameters = undefined;

    try {
      this.state = TransportState.Leaving;
      await this.publishConnection?.close();
      await this.subscribeConnection?.close();
      if (this.signal.isConnected) {
        this.signal.leave();
        await this.signal.close();
      }
    } catch (err) {
      if (err instanceof HMSException) {
        analyticsEventsService.queue(AnalyticsEventFactory.disconnect(err)).flush();
      }
      HMSLogger.e(TAG, 'leave: FAILED ❌', err);
    } finally {
      this.state = TransportState.Disconnected;
      this.observer.onStateChange(this.state);
    }
  }

  async publish(tracks: Array<HMSTrack>): Promise<void> {
    // @FIX: Doesn't wait for one publishTrack to complete
    for (const track of tracks) {
      try {
        await this.publishTrack(track);
      } catch (error) {
        if (error instanceof HMSException) {
          analyticsEventsService
            .queue(
              AnalyticsEventFactory.publishFail({
                devices: this.deviceManager.getDevices(),
                error,
              }),
            )
            .flush();
        }
      }
    }
  }

  async unpublish(tracks: Array<HMSTrack>): Promise<void> {
    for (const track of tracks) {
      await this.unpublishTrack(track);
    }
  }

  sendMessage(message: HMSMessage) {
    this.signal.broadcast(message);
  }

  trackUpdate(track: HMSTrack) {
    const currentTrackStates = Array.from(this.tracks.values());
    const originalTrackState = currentTrackStates.find(
      (trackState) => track.type === trackState.type && track.source === trackState.source,
    );
    if (originalTrackState) {
      const newTrackState = new TrackState({
        ...originalTrackState,
        mute: !track.enabled,
      });
      this.tracks.set(originalTrackState.track_id, newTrackState);
      HMSLogger.d(TAG, 'Track Update', this.tracks, track);
      this.signal.trackUpdate(new Map([[originalTrackState.track_id, newTrackState]]));
    }
  }

  private async publishTrack(track: HMSTrack): Promise<void> {
    HMSLogger.d(TAG, `⏳ publishTrack: trackId=${track.trackId}`, track);
    this.tracks.set(track.trackId, new TrackState(track));
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
    await p;

    // @ts-ignore
    const maxBitrate = track.settings.maxBitrate;
    if (maxBitrate) {
      await stream
        .setMaxBitrate(maxBitrate, track)
        .then(() => {
          HMSLogger.i(TAG, `Setting maxBitrate for ${track.source} ${track.type} to ${maxBitrate} kpbs`);
        })
        .catch((error) => HMSLogger.e(TAG, 'Failed setting maxBitrate', error));
    }

    HMSLogger.d(TAG, `✅ publishTrack: trackId=${track.trackId}`, track, this.callbacks);
  }

  private async unpublishTrack(track: HMSTrack): Promise<void> {
    HMSLogger.d(TAG, `⏳ unpublishTrack: trackId=${track.trackId}`, track);
    this.tracks.delete(track.trackId);
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
    HMSLogger.d(TAG, `✅ unpublishTrack: trackId=${track.trackId}`, this.callbacks);
  }

  private async connectionJoin(
    name: string,
    data: string,
    config: RTCConfiguration,
    autoSubscribeVideo: boolean,
    constraints: RTCOfferOptions = { offerToReceiveAudio: false, offerToReceiveVideo: false },
  ) {
    this.publishConnection = new HMSPublishConnection(this.signal, config, this.publishConnectionObserver, this);
    this.subscribeConnection = new HMSSubscribeConnection(this.signal, config, this.subscribeConnectionObserver);

    try {
      HMSLogger.d(TAG, '⏳ join: Negotiating over PUBLISH connection');
      const offer = await this.publishConnection!.createOffer(constraints, []);
      await this.publishConnection!.setLocalDescription(offer);
      const answer = await this.signal.join(name, data, offer, !autoSubscribeVideo);
      await this.publishConnection!.setRemoteDescription(answer);
      for (const candidate of this.publishConnection!.candidates || []) {
        await this.publishConnection!.addIceCandidate(candidate);
      }

      this.publishConnection!.initAfterJoin();
      HMSLogger.d(TAG, '✅ join: Negotiated over PUBLISH connection');
    } catch (error) {
      this.state = TransportState.Failed;
      throw error;
    }
  }

  private async performPublishRenegotiation(constraints?: RTCOfferOptions) {
    HMSLogger.d(TAG, `⏳ [role=PUBLISH] onRenegotiationNeeded START`, this.tracks);
    const callback = this.callbacks.get(RENEGOTIATION_CALLBACK_ID);
    this.callbacks.delete(RENEGOTIATION_CALLBACK_ID);

    try {
      const offer = await this.publishConnection!.createOffer(constraints, this.tracks);
      await this.publishConnection!.setLocalDescription(offer);
      const answer = await this.signal.offer(offer, this.tracks);
      await this.publishConnection!.setRemoteDescription(answer);
      callback!.promise.resolve(true);
      HMSLogger.d(TAG, `[role=PUBLISH] onRenegotiationNeeded DONE ✅`);
    } catch (err) {
      let ex: HMSException;
      if (err instanceof HMSException) {
        ex = err;
      } else {
        ex = ErrorFactory.GenericErrors.Unknown(HMSAction.PUBLISH, err.message);
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
      this.initConfig = await InitService.fetchInitConfig(token, endpoint);
      await this.openSignal(token, peerId);
      HMSLogger.d(TAG, 'Adding Analytics Transport: JsonRpcSignal');
      analyticsEventsService.addTransport(this.analyticsSignalTransport);
      analyticsEventsService.flush();
    } catch (error) {
      analyticsEventsService
        .queue(AnalyticsEventFactory.connect(error, connectRequestedAt, new Date(), endpoint))
        .flush();
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

      const timeout = new Promise((resolve) => {
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

    return ok;
  };
}
