import EventEmitter from 'eventemitter2';
import { v4 as uuid } from 'uuid';
import ISubscribeConnectionObserver from './ISubscribeConnectionObserver';
import { HMSRemoteStream, HMSSimulcastLayer } from '../../internal';
import { HMSRemoteAudioTrack } from '../../media/tracks/HMSRemoteAudioTrack';
import { HMSRemoteVideoTrack } from '../../media/tracks/HMSRemoteVideoTrack';
import { InitFlags } from '../../signal/init/models';
import JsonRpcSignal from '../../signal/jsonrpc';
import { API_DATA_CHANNEL } from '../../utils/constants';
import HMSLogger from '../../utils/logger';
import { getSdpTrackIdForMid } from '../../utils/session-description';
import { workerSleep } from '../../utils/timer-utils';
import { PreferAudioLayerParams, PreferLayerResponse, PreferVideoLayerParams } from '../channel-messages';
import HMSConnection from '../HMSConnection';
import HMSDataChannel from '../HMSDataChannel';
import { HMSConnectionRole } from '../model';

export default class HMSSubscribeConnection extends HMSConnection {
  private readonly TAG = '[HMSSubscribeConnection]';
  private readonly remoteStreams = new Map<string, HMSRemoteStream>();
  protected readonly observer: ISubscribeConnectionObserver;
  private readonly MAX_RETRIES = 3;

  readonly nativeConnection: RTCPeerConnection;

  private pendingMessageQueue: string[] = [];

  private apiChannel?: HMSDataChannel;
  private eventEmitter = new EventEmitter({ maxListeners: 60 });

  private initNativeConnectionCallbacks() {
    this.nativeConnection.oniceconnectionstatechange = () => {
      this.observer.onIceConnectionChange(this.nativeConnection.iceConnectionState);
    };

    // @TODO(eswar): Remove this. Use iceconnectionstate change with interval and threshold.
    this.nativeConnection.onconnectionstatechange = () => {
      this.observer.onConnectionStateChange(this.nativeConnection.connectionState);
    };

    this.nativeConnection.ondatachannel = e => {
      if (e.channel.label !== API_DATA_CHANNEL) {
        // TODO: this.observer.onDataChannel(e.channel);
        return;
      }

      this.apiChannel = new HMSDataChannel(
        e.channel,
        {
          onMessage: (value: string) => {
            this.eventEmitter.emit('message', value);
            this.observer.onApiChannelMessage(value);
          },
        },
        `role=${this.role}`,
      );

      e.channel.onopen = this.handlePendingApiMessages;
    };

    this.nativeConnection.onicecandidate = e => {
      if (e.candidate !== null) {
        this.observer.onIceCandidate(e.candidate);
        this.signal.trickle(this.role, e.candidate);
      }
    };

    this.nativeConnection.ontrack = e => {
      const stream = e.streams[0];
      const streamId = stream.id;

      if (!this.remoteStreams.has(streamId)) {
        const remote = new HMSRemoteStream(stream, this);
        this.remoteStreams.set(streamId, remote);
      }

      stream.addEventListener('removetrack', (ev: MediaStreamTrackEvent) => {
        if (ev.track.id !== e.track.id) {
          return;
        }
        /*
         * this match has to be with nativetrack.id instead of track.trackId as the latter refers to sdp track id for
         * ease of correlating update messages coming from the backend. The two track ids are usually the same, but
         * can be different for some browsers. checkout sdptrackid field in HMSTrack for more details.
         */
        const toRemoveTrackIdx = remote.tracks.findIndex(
          track => track.nativeTrack.id === ev.track.id && e.transceiver.mid === track.transceiver?.mid,
        );
        if (toRemoveTrackIdx >= 0) {
          const toRemoveTrack = remote.tracks[toRemoveTrackIdx];
          this.observer.onTrackRemove(toRemoveTrack);
          remote.tracks.splice(toRemoveTrackIdx, 1);
          // If the length becomes 0 we assume that stream is removed entirely
          if (remote.tracks.length === 0) {
            this.remoteStreams.delete(streamId);
          }
        }
      });

      const remote = this.remoteStreams.get(streamId)!;
      const isAudioTrack = e.track.kind === 'audio';
      const TrackCls = isAudioTrack ? HMSRemoteAudioTrack : HMSRemoteVideoTrack;
      const track = isAudioTrack
        ? new TrackCls(remote, e.track)
        : new TrackCls(remote, e.track, undefined, this.isFlagEnabled(InitFlags.FLAG_DISABLE_NONE_LAYER_REQUEST));
      // reset the simulcast layer to none when new video tracks are added, UI will subscribe when required
      if (e.track.kind === 'video') {
        remote.setVideoLayerLocally(HMSSimulcastLayer.NONE, 'addTrack', 'subscribeConnection');
      }
      track.transceiver = e.transceiver;
      const trackId = getSdpTrackIdForMid(this.remoteDescription, e.transceiver?.mid);
      trackId && track.setSdpTrackId(trackId);
      remote.tracks.push(track);
      this.observer.onTrackAdd(track);
    };
  }

  constructor(
    signal: JsonRpcSignal,
    config: RTCConfiguration,
    private isFlagEnabled: (flag: InitFlags) => boolean,
    observer: ISubscribeConnectionObserver,
  ) {
    super(HMSConnectionRole.Subscribe, signal);
    this.observer = observer;

    this.nativeConnection = new RTCPeerConnection(config);
    this.initNativeConnectionCallbacks();
  }

  sendOverApiDataChannel(message: string) {
    if (this.apiChannel && this.apiChannel.readyState === 'open') {
      this.apiChannel.send(message);
    } else {
      HMSLogger.w(this.TAG, `API Data channel not ${this.apiChannel ? 'open' : 'present'}, queueing`, message);
      this.pendingMessageQueue.push(message);
    }
  }

  async sendOverApiDataChannelWithResponse<T extends PreferAudioLayerParams | PreferVideoLayerParams>(
    message: T,
    requestId?: string,
  ): Promise<PreferLayerResponse> {
    const id = uuid();
    if (message.method === 'prefer-video-track-state') {
      const disableAutoUnsubscribe = this.isFlagEnabled(InitFlags.FLAG_DISABLE_VIDEO_TRACK_AUTO_UNSUBSCRIBE);
      if (disableAutoUnsubscribe && message.params.max_spatial_layer === HMSSimulcastLayer.NONE) {
        HMSLogger.d(this.TAG, 'video auto unsubscribe is disabled, request is ignored');
        return { id } as PreferLayerResponse;
      }
    }
    const request = JSON.stringify({
      id: requestId || id,
      jsonrpc: '2.0',
      ...message,
    });
    return this.sendMessage(request, id);
  }

  close() {
    super.close();
    this.apiChannel?.close();
  }

  private handlePendingApiMessages = () => {
    this.eventEmitter.emit('open', true);
    if (this.pendingMessageQueue.length > 0) {
      HMSLogger.d(this.TAG, 'Found pending message queue, sending messages');
      this.pendingMessageQueue.forEach(msg => this.sendOverApiDataChannel(msg));
      this.pendingMessageQueue.length = 0;
    }
  };

  // eslint-disable-next-line complexity
  private sendMessage = async (request: string, requestId: string): Promise<PreferLayerResponse> => {
    if (this.apiChannel?.readyState !== 'open') {
      await this.eventEmitter.waitFor('open');
    }
    let response: PreferLayerResponse;
    for (let i = 0; i < this.MAX_RETRIES; i++) {
      this.apiChannel!.send(request);
      response = await this.waitForResponse(requestId);
      const error = response.error;
      if (error) {
        // Don't retry or do anything, track is already removed
        if (error.code === 404) {
          HMSLogger.d(this.TAG, `Track not found ${requestId}`, { request, try: i + 1, error });
          break;
        }
        HMSLogger.d(this.TAG, `Failed sending ${requestId}`, { request, try: i + 1, error });
        const shouldRetry = error.code / 100 === 5 || error.code === 429;
        if (!shouldRetry) {
          throw Error(`code=${error.code}, message=${error.message}`);
        }
        const delay = (2 + Math.random() * 2) * 1000;
        await workerSleep(delay);
      } else {
        break;
      }
    }
    return response!;
  };

  private waitForResponse = async (requestId: string): Promise<PreferLayerResponse> => {
    const res = await this.eventEmitter.waitFor('message', function (value) {
      return value.includes(requestId);
    });
    const response = JSON.parse(res[0] as string);
    HMSLogger.d(this.TAG, `response for ${requestId} -`, JSON.stringify(response, null, 2));
    return response;
  };
}
