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
import { RENEGOTIATION_CALLBACK_ID } from '../utils/constants';
import HMSLocalStream from '../media/streams/HMSLocalStream';
import HMSTrackSettings from '../media/settings/HMSTrackSettings';
import HMSLogger from '../utils/logger';
import HMSVideoTrackSettings from '../media/settings/HMSVideoTrackSettings';
import HMSMessage from '../interfaces/message';
import { TrackState } from '../sdk/models/HMSNotifications';

const TAG = '[HMSTransport]:';
export default class HMSTransport implements ITransport {
  private tracks: Map<string, TrackState> = new Map();
  private readonly observer: ITransportObserver;
  private publishConnection: HMSPublishConnection | null = null;
  private subscribeConnection: HMSSubscribeConnection | null = null;

  /**
   * Map of callbacks used to wait for an event to fire.
   * Used here for:
   *  1. publish/unpublish waits for [IPublishConnectionObserver.onRenegotiationNeeded] to complete
   */
  private readonly callbacks = new Map<string, PromiseCallbacks<boolean>>();

  private signalObserver: ISignalEventsObserver = {
    onOffer: async (jsep: RTCSessionDescriptionInit) => {
      await this.subscribeConnection!.setRemoteDescription(jsep);
      for (const candidate of this.subscribeConnection!.candidates) {
        await this.subscribeConnection!.addIceCandidate(candidate);
      }
      this.subscribeConnection!.candidates.length = 0;
      const answer = await this.subscribeConnection!.createAnswer();
      await this.subscribeConnection!.setLocalDescription(answer);
      this.signal.answer(answer);
    },
    onTrickle: async (trickle: HMSTrickle) => {
      const connection =
        trickle.target === HMSConnectionRole.PUBLISH ? this.publishConnection! : this.subscribeConnection!;
      if (connection.remoteDescription === null) {
        // ICE candidates can't be added without any remote session description
        connection.candidates.push(trickle.candidate);
      } else {
        await connection.addIceCandidate(trickle.candidate);
      }
    },
    onNotification: (message: Object) => this.observer.onNotification(message),
    onFailure: (exception: HMSException) => {
      // TODO: Init the reconnecting logic
      this.observer.onFailure(exception);
    },
  };

  private readonly signal: ISignal = new JsonRpcSignal(this.signalObserver);

  private publishConnectionObserver: IPublishConnectionObserver = {
    onRenegotiationNeeded: async () => {
      HMSLogger.d(TAG, `⏳ [role=PUBLISH] onRenegotiationNeeded START`, this.tracks);
      const callback = this.callbacks.get(RENEGOTIATION_CALLBACK_ID);
      this.callbacks.delete(RENEGOTIATION_CALLBACK_ID);

      // TODO: Handle errors, pass these errors as publish failure (try-catch)
      try {
        const offer = await this.publishConnection!.createOffer();
        await this.publishConnection!.setLocalDescription(offer);
        const answer = await this.signal.offer(offer, this.tracks);
        await this.publishConnection!.setRemoteDescription(answer);
        callback?.resolve(true);
        HMSLogger.d(TAG, `✅ [role=PUBLISH] onRenegotiationNeeded DONE`, this.tracks);
      } catch (e) {
        console.error(TAG, e);
      }
    },

    onIceConnectionChange: (newState: RTCIceConnectionState) => {
      if (newState === 'failed') {
        // TODO: Handle `failed` event, initiate restartIce/reconnection
      }
    },
  };

  private subscribeConnectionObserver: ISubscribeConnectionObserver = {
    onApiChannelMessage: (message: string) => {
      this.observer.onNotification(JSON.parse(message));
    },

    onTrackAdd: (track: HMSTrack) => this.observer.onTrackAdd(track),
    onTrackRemove: (track: HMSTrack) => this.observer.onTrackRemove(track),

    onIceConnectionChange: (newState: RTCIceConnectionState) => {
      if (newState === 'failed') {
        // TODO: Handle `failed` event, initiate restartIce/reconnection
      }
    },
  };

  constructor(observer: ITransportObserver) {
    this.observer = observer;
  }

  async getLocalScreen(settings: HMSVideoTrackSettings): Promise<HMSTrack> {
    const track = await HMSLocalStream.getLocalScreen(settings);
    return track;
  }

  async getLocalTracks(settings: HMSTrackSettings): Promise<Array<HMSTrack>> {
    return await HMSLocalStream.getLocalTracks(settings);
  }

  async join(authToken: string, peerId: string, customData: any): Promise<void> {
    const config = await InitService.fetchInitConfig(authToken);

    HMSLogger.d(TAG, '⏳ join: connecting to ws endpoint', config.endpoint);
    await this.signal.open(`${config.endpoint}?peer=${peerId}&token=${authToken}`);
    HMSLogger.d(TAG, '✅ join: connected to ws endpoint');

    HMSLogger.d(TAG, customData);

    this.publishConnection = new HMSPublishConnection(
      this.signal,
      config.rtcConfiguration,
      this.publishConnectionObserver,
      this,
    );

    this.subscribeConnection = new HMSSubscribeConnection(
      this.signal,
      config.rtcConfiguration,
      this.subscribeConnectionObserver,
    );

    HMSLogger.d(TAG, '⏳ join: Negotiating over PUBLISH connection');
    const offer = await this.publishConnection.createOffer();
    await this.publishConnection.setLocalDescription(offer);
    const answer = await this.signal.join(customData.name, peerId, offer);
    await this.publishConnection.setRemoteDescription(answer);
    for (const candidate of this.publishConnection.candidates) {
      await this.publishConnection.addIceCandidate(candidate);
    }
    this.publishConnection.initAfterJoin();
    HMSLogger.d(TAG, '✅ join: Negotiated over PUBLISH connection');

    // TODO: Handle exceptions raised - wrap them in HMSException
    HMSLogger.d(TAG, '✅ join: successful');
  }

  async leave(): Promise<void> {
    await this.publishConnection!.close();
    await this.subscribeConnection!.close();
    this.signal.leave();
    await this.signal.close();
  }

  private async publishTrack(track: HMSTrack): Promise<void> {
    HMSLogger.d(TAG, `⏳ publishTrack: trackId=${track.trackId}`, track);
    this.tracks.set(track.trackId, new TrackState(track));
    const p = new Promise<boolean>((resolve, reject) => {
      this.callbacks.set(RENEGOTIATION_CALLBACK_ID, { resolve, reject });
    });
    const stream = track.stream as HMSLocalStream;
    stream.setConnection(this.publishConnection!);
    stream.addTransceiver(track);
    await p;

    // @ts-ignore
    const maxBitrate = track.settings.maxBitRate;
    await stream
      .setMaxBitrate(maxBitrate * 1000, track)
      .then(() => {
        HMSLogger.i(TAG, `Setting maxBitrate for ${track.source} ${track.type} to ${maxBitrate} kpbs`);
      })
      .catch((error) => HMSLogger.e(TAG, 'Failed setting maxBitrate', error));

    HMSLogger.d(TAG, `✅ publishTrack: trackId=${track.trackId}`, this.callbacks);
  }

  private async unpublishTrack(track: HMSTrack): Promise<void> {
    HMSLogger.d(TAG, `⏳ unpublishTrack: trackId=${track.trackId}`, track);
    this.tracks.delete(track.trackId);
    const p = new Promise<boolean>((resolve, reject) => {
      this.callbacks.set(RENEGOTIATION_CALLBACK_ID, { resolve, reject });
    });
    const stream = track.stream as HMSLocalStream;
    stream.removeSender(track);
    await p;
    HMSLogger.d(TAG, `✅ unpublishTrack: trackId=${track.trackId}`, this.callbacks);
  }

  async publish(tracks: Array<HMSTrack>): Promise<void> {
    for (const track of tracks) {
      await this.publishTrack(track);
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
}
