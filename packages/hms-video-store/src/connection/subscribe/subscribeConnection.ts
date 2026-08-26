import EventEmitter, { CancelablePromise, WaitForOptions } from 'eventemitter2';
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
  /**
   * Bounds both waits on the api data channel - for it to open, and for a reply. The first request
   * of a session has been seen to go unanswered, and a channel that is closed or replaced never
   * emits 'open' again; unbounded, either leaves that caller waiting for the rest of the session.
   * Deliberately generous: a retry replays the original serialized request, so a premature one can
   * apply stale desired state over a newer request.
   */
  private readonly RESPONSE_TIMEOUT = 10000;

  readonly nativeConnection: RTCPeerConnection;

  private pendingMessageQueue: string[] = [];
  /** `${method}:${track_id}` -> the id of the newest request for it; older ones stop retrying */
  private latestRequestPerState = new Map<string, string>();
  private closed = false;
  /**
   * Rejectors for the waits currently parked on the api data channel. close() fires them so a
   * leave or an SFU migration settles every pending request at once, rather than each waiting out
   * its RESPONSE_TIMEOUT first - the catch below breaks on `closed`, so it is one timeout per
   * track, but that is still 10s of nothing per tile on every leave.
   */
  private pendingAborts = new Set<(error: Error) => void>();

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

  /**
   * A retry replays the bytes serialised here, so a request still retrying after a newer one has
   * been made for the same track would re-apply state the caller has moved on from. Each request
   * claims its piece of subscription state, and stops once it no longer holds the claim.
   */
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
    const stateKey = `${message.method}:${message.params.track_id}`;
    this.latestRequestPerState.set(stateKey, id);
    try {
      return await this.sendMessage(request, id, stateKey);
    } finally {
      if (this.latestRequestPerState.get(stateKey) === id) {
        this.latestRequestPerState.delete(stateKey);
      }
    }
  }

  close() {
    this.closed = true;
    super.close();
    this.apiChannel?.close();
    this.pendingAborts.forEach(abort => abort(Error('Subscribe connection closed')));
    this.pendingAborts.clear();
  }

  /**
   * Settles `wait` early if the connection is closed while it is parked on the api data channel.
   * The wait is cancelled rather than just abandoned: eventemitter2 keeps the listener subscribed
   * until its own timeout otherwise, and the emitter is capped at 60.
   */
  private abortOnClose = async <T>(wait: CancelablePromise<T>): Promise<T> => {
    // close() has already drained pendingAborts, so a wait parked after it would never be settled
    if (this.closed) {
      // cancel() rejects the wait, and nothing has subscribed to it yet - Promise.race below is
      // what normally does that, and we are not reaching it
      wait.catch(() => undefined);
      wait.cancel('connection closed');
      throw Error('Subscribe connection closed');
    }
    let abort!: (error: Error) => void;
    const aborted = new Promise<never>((_, reject) => {
      abort = reject;
    });
    this.pendingAborts.add(abort);
    try {
      // race subscribes to both, so a later rejection from the loser is never unhandled
      return await Promise.race([wait, aborted]);
    } finally {
      this.pendingAborts.delete(abort);
      wait.cancel('request settled');
    }
  };

  private handlePendingApiMessages = () => {
    this.eventEmitter.emit('open', true);
    if (this.pendingMessageQueue.length > 0) {
      HMSLogger.d(this.TAG, 'Found pending message queue, sending messages');
      this.pendingMessageQueue.forEach(msg => this.sendOverApiDataChannel(msg));
      this.pendingMessageQueue.length = 0;
    }
  };

  // eslint-disable-next-line complexity
  private sendMessage = async (request: string, requestId: string, stateKey: string): Promise<PreferLayerResponse> => {
    /** a newer request for the same track has taken over this piece of state */
    const superseded = () => this.latestRequestPerState.get(stateKey) !== requestId;
    /**
     * Resolve the way the disableAutoUnsubscribe skip does rather than reporting an error nobody
     * can act on - the newer request owns the outcome. Every exit path has to agree on this.
     */
    const dropped = () => {
      HMSLogger.d(this.TAG, `Superseded, dropping ${requestId}`, request);
      return { id: requestId } as PreferLayerResponse;
    };
    let response: PreferLayerResponse | undefined;
    /** the per-attempt detail is a warn, which an app on setLogLevel(ERROR) never sees */
    let lastAttemptError: Error | undefined;
    for (let i = 0; i < this.MAX_RETRIES; i++) {
      // a previous attempt's error response must not stand in for this attempt's outcome
      response = undefined;
      if (superseded()) {
        return dropped();
      }
      try {
        await this.waitForChannelOpen();
        // the claim can change hands while parked on the open wait, and a retry replays the bytes
        // serialised at request time - checking only before the wait still lets stale state out
        if (superseded()) {
          return dropped();
        }
        // send can throw too - the channel may close between the open check and here
        this.apiChannel!.send(request);
        response = await this.waitForResponse(requestId);
      } catch (error) {
        lastAttemptError = error as Error;
        HMSLogger.w(this.TAG, `Attempt failed for ${requestId}`, { request, try: i + 1, error });
        if (this.closed) {
          break;
        }
        continue;
      }
      const error = response.error;
      if (error) {
        // Don't retry or do anything, track is already removed - and nothing for the caller to act
        // on either, so this stays a resolve rather than joining the throwing paths below
        if (error.code === 404) {
          HMSLogger.d(this.TAG, `Track not found ${requestId}`, { request, try: i + 1, error });
          return response;
        }
        HMSLogger.d(this.TAG, `Failed sending ${requestId}`, { request, try: i + 1, error });
        // exact division is only ever true for 500 - a 502/503/504 from an SFU restarting has to
        // retry the same way, not throw on the first attempt
        const shouldRetry = Math.floor(error.code / 100) === 5 || error.code === 429;
        if (!shouldRetry) {
          if (superseded()) {
            return dropped();
          }
          throw Error(`code=${error.code}, message=${error.message} - ${requestId} not retried`);
        }
        if (i < this.MAX_RETRIES - 1) {
          const delay = (2 + Math.random() * 2) * 1000;
          await workerSleep(delay);
        }
      } else {
        break;
      }
    }
    /**
     * Every exit agrees on one rule: a request the newer one took over is not a failure, and a
     * response the SFU actually sent is the outcome. So an error is reported only when this request
     * still owns the state, and a success is returned whatever happened to the claim meanwhile -
     * discarding it would report a request the SFU applied as dropped.
     */
    if (response?.error) {
      if (superseded()) {
        return dropped();
      }
      // the loop can run out of attempts still holding a retryable error, and no caller inspects
      // `error` on a resolved response, so returning it here reads as a request the SFU applied
      throw Error(
        `code=${response.error.code}, message=${response.error.message} - ${requestId} after ${this.MAX_RETRIES} tries`,
      );
    }
    if (response) {
      return response;
    }
    if (superseded()) {
      return dropped();
    }
    if (this.closed) {
      throw Error(`Subscribe connection closed before ${requestId} was answered - ${request}`);
    }
    throw Error(
      `No response from SFU for ${requestId} after ${this.MAX_RETRIES} tries - ${request}`,
      // a malformed reply lands here too, via JSON.parse in waitForResponse - without the cause,
      // "no response" is a flatly wrong diagnosis for a reply that did arrive
      { cause: lastAttemptError },
    );
  };

  /**
   * Checked per attempt rather than once up front: 'open' is emitted from the channel's onopen, so
   * a channel that is closed or replaced never emits again and an unbounded wait here would hang
   * the caller for the rest of the session.
   */
  private waitForChannelOpen = async () => {
    if (this.apiChannel?.readyState === 'open') {
      return;
    }
    await this.abortOnClose(
      this.eventEmitter.waitFor('open', {
        timeout: this.RESPONSE_TIMEOUT,
      } as WaitForOptions) as CancelablePromise<unknown>,
    );
  };

  private waitForResponse = async (requestId: string): Promise<PreferLayerResponse> => {
    const res = (await this.abortOnClose(
      this.eventEmitter.waitFor('message', {
        filter: (value: string) => value.includes(requestId),
        timeout: this.RESPONSE_TIMEOUT,
      } as WaitForOptions) as CancelablePromise<unknown>,
    )) as unknown[];
    const response = JSON.parse(res[0] as string);
    HMSLogger.d(this.TAG, `response for ${requestId} -`, JSON.stringify(response, null, 2));
    return response;
  };
}
