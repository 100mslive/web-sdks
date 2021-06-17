import ITransportObserver from './ITransportObserver';
import ITransport from './ITransport';
import HMSPublishConnection from '../connection/publish';
import HMSSubscribeConnection from '../connection/subscribe';
import InitService from '../signal/init';
import { ISignal } from '../signal/ISignal';
import { ISignalEventsObserver } from '../signal/ISignalEventsObserver';
import JsonRpcSignal from '../signal/jsonrpc';
import { HMSConnectionRole, HMSTrickle } from '../connection/model';
import { IPublishConnectionObserver } from '../connection/publish/IPublishConnectionObserver';
import ISubscribeConnectionObserver from '../connection/subscribe/ISubscribeConnectionObserver';
import HMSTrack from '../media/tracks/HMSTrack';
import HMSException from '../error/HMSException';
import { PromiseCallbacks } from '../utils/promise';
import { DEFAULT_SIGNAL_PING_TIMEOUT, RENEGOTIATION_CALLBACK_ID, SIGNAL_PING_INTERVAL } from '../utils/constants';
import HMSLocalStream, { HMSLocalTrack } from '../media/streams/HMSLocalStream';
import HMSTrackSettings from '../media/settings/HMSTrackSettings';
import HMSLogger from '../utils/logger';
import HMSVideoTrackSettings from '../media/settings/HMSVideoTrackSettings';
import HMSMessage from '../interfaces/message';
import { TrackState } from '../sdk/models/HMSNotifications';
import { TransportState } from './models/TransportState';
import { ErrorFactory, HMSAction } from '../error/ErrorFactory';
import { HMSConnectionMethodException } from '../error/utils';
import analyticsEventsService from '../analytics/AnalyticsEventsService';
import AnalyticsEventFactory from '../analytics/AnalyticsEventFactory';
import { JoinParameters } from './models/JoinParameters';
import { InitConfig } from '../signal/init/models';
import { TransportFailureCategory } from './models/TransportFailureCategory';
import HMSLocalVideoTrack from '../media/tracks/HMSLocalVideoTrack';
import { RetryScheduler } from './RetryScheduler';

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
  private endpoint!: string;
  private joinParameters?: JoinParameters;
  private retryScheduler = new RetryScheduler(analyticsEventsService, (state, error) => {
    this.state = state;
    this.observer.onStateChange(this.state, error);
  });
  private pingPongIntervalId: number = 0;

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
        for (const candidate of this.subscribeConnection!.candidates) {
          await this.subscribeConnection!.addIceCandidate(candidate);
        }
        this.subscribeConnection!.candidates.length = 0;
        const answer = await this.subscribeConnection!.createAnswer();
        await this.subscribeConnection!.setLocalDescription(answer);
        this.signal.answer(answer);
      } catch (err) {
        let ex: HMSException;
        if (err instanceof HMSException) {
          ex = err;
        } else if (err instanceof HMSConnectionMethodException) {
          ex = err.toHMSException(HMSAction.SUBSCRIBE);
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
      this.observer.onStateChange(TransportState.Failed, error);
    },

    onFailure: (exception: HMSException) => {
      analyticsEventsService.queue(AnalyticsEventFactory.disconnect(exception)).flush();
      analyticsEventsService.removeTransport(this.signal);

      if (this.joinParameters) {
        this.retryScheduler.schedule(
          TransportFailureCategory.SignalDisconnect,
          exception,
          this.retrySignalDisconnectTask,
        );
      }
    },
  };

  private signal: ISignal = new JsonRpcSignal(this.signalObserver);

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
      analyticsEventsService.queue(AnalyticsEventFactory.trackAdd(track)).flush();
      this.observer.onTrackAdd(track);
    },

    onTrackRemove: (track: HMSTrack) => {
      HMSLogger.d(TAG, '[Subscribe] onTrackRemove', track);
      analyticsEventsService.queue(AnalyticsEventFactory.trackRemove(track)).flush();
      this.observer.onTrackRemove(track);
    },

    onIceConnectionChange: async (newState: RTCIceConnectionState) => {
      HMSLogger.d('subscriber ice connection state change, ', newState);
      if (newState === 'failed') {
        // await this.handleIceConnectionFailure(HMSConnectionRole.Subscribe);
      }
    },

    // @TODO(eswar): Remove this. Use iceconnectionstate change with interval and threshold.
    onConnectionStateChange: async (newState: RTCPeerConnectionState) => {
      HMSLogger.d('subscriber connection state change, ', newState);
      if (newState === 'failed') {
        await this.handleIceConnectionFailure(HMSConnectionRole.Subscribe);
      }
    },
  };

  constructor(observer: ITransportObserver) {
    this.observer = observer;
  }

  async getLocalScreen(settings: HMSVideoTrackSettings): Promise<HMSLocalVideoTrack> {
    try {
      const track = await HMSLocalStream.getLocalScreen(settings);
      analyticsEventsService.queue(AnalyticsEventFactory.getLocalScreen(settings, track)).flush();
      return track;
    } catch (error) {
      if (error instanceof HMSException) {
        analyticsEventsService.queue(AnalyticsEventFactory.getLocalScreen(settings, undefined, error)).flush();
      }
      throw error;
    }
  }

  async getLocalTracks(settings: HMSTrackSettings): Promise<Array<HMSLocalTrack>> {
    try {
      const tracks = await HMSLocalStream.getLocalTracks(settings);

      tracks.forEach((track) => analyticsEventsService.queue(AnalyticsEventFactory.getLocalTracks(settings, track)));
      analyticsEventsService.flush();

      return tracks;
    } catch (error) {
      if (error instanceof HMSException) {
        analyticsEventsService.queue(AnalyticsEventFactory.getLocalTracks(settings, undefined, error)).flush();
      }
      throw error;
    }
  }

  async join(
    authToken: string,
    peerId: string,
    customData: { name: string; metaData: string },
    initEndpoint: string = 'https://prod-init.100ms.live/init',
    autoSubscribeVideo: boolean = true,
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
    let config: InitConfig;
    try {
      config = await this.connect(authToken, initEndpoint, peerId);
    } catch (error) {
      this.state = TransportState.Failed;
      this.observer.onStateChange(this.state, error);
      return;
    }

    const joinRequestedAt = new Date();
    try {
      await this.connectionJoin(customData.name, customData.metaData, config.rtcConfiguration, autoSubscribeVideo);
    } catch (error) {
      HMSLogger.d(TAG, 'join: failed ❌');
      this.state = TransportState.Failed;
      if (error instanceof HMSException) {
        analyticsEventsService.queue(AnalyticsEventFactory.join(joinRequestedAt, new Date(), error)).flush();
      }
      this.observer.onStateChange(this.state, error);
      return;
    }

    HMSLogger.d(TAG, '✅ join: successful');
    this.state = TransportState.Joined;
    this.observer.onStateChange(this.state);
  }

  async leave(): Promise<void> {
    analyticsEventsService.queue(AnalyticsEventFactory.leave()).flush();
    analyticsEventsService.removeTransport(this.signal);

    this.retryScheduler.reset();
    this.joinParameters = undefined;

    clearInterval(this.pingPongIntervalId);
    try {
      await this.publishConnection!.close();
      await this.subscribeConnection!.close();
      this.signal.leave();
      await this.signal.close();
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
    for (const track of tracks) {
      try {
        await this.publishTrack(track);
      } catch (error) {
        if (error instanceof HMSException) {
          analyticsEventsService.queue(AnalyticsEventFactory.publishFail(error)).flush();
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
      analyticsEventsService.queue(AnalyticsEventFactory.trackStateChange(track.type, newTrackState.mute)).flush();
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
    stream.addTransceiver(track);
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

    analyticsEventsService.queue(AnalyticsEventFactory.trackStateChange(track.type, !track.enabled)).flush();
    HMSLogger.d(TAG, `✅ publishTrack: trackId=${track.trackId}`, this.callbacks);
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
      } else if (err instanceof HMSConnectionMethodException) {
        ex = err.toHMSException(HMSAction.PUBLISH);
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
      );
    }
  }

  private async connect(token: string, endpoint: string, peerId: string) {
    HMSLogger.d(TAG, 'connect: started ⏰');
    let config: InitConfig;
    const connectRequestedAt = new Date();
    try {
      config = await InitService.fetchInitConfig(token, endpoint);

      HMSLogger.d(TAG, '⏳ connect: connecting to ws endpoint', config.endpoint);
      this.endpoint = `${config.endpoint}?peer=${peerId}&token=${token}`;
      await this.signal.open(this.endpoint);
      this.pingPongLoop(config);
      HMSLogger.d(TAG, '✅ connect: connected to ws endpoint');

      HMSLogger.d(TAG, 'Adding Analytics Transport: JsonRpcSignal');
      analyticsEventsService.addTransport(this.signal);
    } catch (ex) {
      if (ex instanceof HMSException) {
        analyticsEventsService
          .queue(AnalyticsEventFactory.connect(connectRequestedAt, new Date(), endpoint, ex))
          .flush();
      }
      HMSLogger.d(TAG, '❌ connect: failed', { error: ex });
      throw ex;
    }

    return config;
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

      await p;
    }

    return true;
  };

  private retrySignalDisconnectTask = async () => {
    let ok = true;

    // Check if ws is disconnected - otherwise if only publishIce fails
    // and ws connect is success then we don't need to reconnect to WebSocket
    if (!this.signal.isConnected) {
      try {
        await this.connect(this.joinParameters!.authToken, this.joinParameters!.endpoint, this.joinParameters!.peerId);
        ok = true;
      } catch (ex) {
        ok = false;
      }
    }

    ok = ok && (await this.retryPublishIceFailedTask());

    return ok;
  };

  private pingPongLoop(config: InitConfig) {
    const pingTimeout = config.pingTimeout || DEFAULT_SIGNAL_PING_TIMEOUT;
    // @ts-ignore TS doesn't believe setInterval returns a number
    this.pingPongIntervalId = setInterval(async () => {
      if (this.signal.isConnected) {
        const pongTimeDiff = await this.signal.ping(pingTimeout);
        if (pongTimeDiff > pingTimeout) {
          this.signalObserver.onFailure(
            ErrorFactory.WebSocketConnectionErrors.WebSocketConnectionLost(HMSAction.INIT, 'Pong timeout'),
          );
        }
      } else {
        // socket closed, stop pinging
        clearInterval(this.pingPongIntervalId);
      }
    }, SIGNAL_PING_INTERVAL);
  }
}
