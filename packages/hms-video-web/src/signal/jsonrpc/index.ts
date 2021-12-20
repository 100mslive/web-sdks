import { v4 as uuid } from 'uuid';
import { ISignal } from '../ISignal';
import { ISignalEventsObserver } from '../ISignalEventsObserver';
import {
  Track,
  AcceptRoleChangeParams,
  RequestForRoleChangeParams,
  TrackUpdateRequestParams,
  RemovePeerRequest,
  MultiTrackUpdateRequestParams,
  StartRTMPOrRecordingRequestParams,
  UpdatePeerRequestParams,
} from '../interfaces';
import { HMSConnectionRole, HMSTrickle } from '../../connection/model';
import { convertSignalMethodtoErrorAction, HMSSignalMethod, JsonRpcRequest, JsonRpcResponse } from './models';
import { PromiseCallbacks } from '../../utils/promise';
import HMSLogger from '../../utils/logger';
import { ErrorFactory, HMSAction } from '../../error/ErrorFactory';
import AnalyticsEvent from '../../analytics/AnalyticsEvent';
import { DEFAULT_SIGNAL_PING_TIMEOUT, DEFAULT_SIGNAL_PING_INTERVAL } from '../../utils/constants';
import Message from '../../sdk/models/HMSMessage';
import { HMSException } from '../../error/HMSException';
import { HLSConfig } from '~interfaces/hls-config';

export default class JsonRpcSignal implements ISignal {
  private readonly TAG = '[ SIGNAL ]: ';
  readonly observer: ISignalEventsObserver;

  /**
   * Sometimes before [join] is completed, there could be a lot of trickles
   * Sending [HMSTrickle]` before [join] web socket message leads to
   * error: [500] no rtc transport exists for this Peer
   *
   * We keep a list of pending trickles and send them immediately after [join]
   * is done.
   */
  private isJoinCompleted = false;
  private pendingTrickle: Array<HMSTrickle> = [];

  private socket: WebSocket | null = null;

  private callbacks = new Map<string, PromiseCallbacks<string>>();

  private _isConnected = false;
  private id = 0;

  public get isConnected(): boolean {
    return this._isConnected;
  }

  public set isConnected(newValue: boolean) {
    HMSLogger.d(this.TAG, 'isConnected set', { id: this.id, old: this._isConnected, new: newValue });
    if (this._isConnected === newValue) {
      return;
    }

    if (this._isConnected && !newValue) {
      // went offline
      this._isConnected = newValue;
      this.observer.onOffline();
    } else if (!this._isConnected && newValue) {
      // went online
      this._isConnected = newValue;
      this.observer.onOnline();
    }
  }

  constructor(observer: ISignalEventsObserver) {
    this.observer = observer;
    window.addEventListener('offline', () => {
      HMSLogger.d(this.TAG, 'Window network offline');
      this.isConnected = false;
    });

    window.addEventListener('online', () => {
      HMSLogger.d(this.TAG, 'Window network online');
    });

    this.onCloseHandler = this.onCloseHandler.bind(this);
    this.onMessageHandler = this.onMessageHandler.bind(this);
  }

  private async call<T>(method: string, params: any): Promise<T> {
    const id = uuid();
    const message = { method, params, id, jsonrpc: '2.0' } as JsonRpcRequest;

    this.socket!.send(JSON.stringify(message));

    try {
      const response = await new Promise<any>((resolve, reject) => {
        this.callbacks.set(id, { resolve, reject });
      });

      return response;
    } catch (ex) {
      const error = ex as HMSException;
      throw ErrorFactory.WebsocketMethodErrors.ServerErrors(
        Number((error as HMSException).code),
        convertSignalMethodtoErrorAction(method as HMSSignalMethod),
        (error as HMSException).message,
      );
    }
  }

  private notify(method: string, params: any) {
    const message = { method, params };

    this.socket!.send(JSON.stringify(message));
  }

  open(uri: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // cleanup
      if (this.socket) {
        this.socket.removeEventListener('close', this.onCloseHandler);
        this.socket.removeEventListener('message', this.onMessageHandler);
      }

      this.socket = new WebSocket(uri); // @DISCUSS: Inject WebSocket as a dependency so that it can be easier to mock and test

      const errorListener = (error: Event) => {
        HMSLogger.d(this.TAG, 'Error opening socket connection', error);
        reject(
          ErrorFactory.WebSocketConnectionErrors.GenericConnect(HMSAction.JOIN, 'Error opening socket connection'),
        );
      };
      this.socket.addEventListener('error', errorListener);

      const openHandler = () => {
        resolve();
        this.isConnected = true;
        this.id++;
        this.socket!.removeEventListener('open', openHandler);
        this.socket!.removeEventListener('error', errorListener);
        this.pingPongLoop(this.id).catch(error => HMSLogger.e(this.TAG, error));
      };

      this.socket.addEventListener('open', openHandler);
      this.socket.addEventListener('close', this.onCloseHandler);
      this.socket.addEventListener('message', this.onMessageHandler);
    });
  }

  async close(): Promise<void> {
    const p = new Promise<void>(resolve => {
      this.socket!.addEventListener('close', () => resolve());
    });
    // @TODO: Clean up: Remove event listeners.

    // For `1000` Refer: https://tools.ietf.org/html/rfc6455#section-7.4.1
    this.socket!.close(1000, 'Normal Close');
    this.isConnected = false;
    this.socket!.removeEventListener('close', this.onCloseHandler);
    this.socket!.removeEventListener('message', this.onMessageHandler);
    return p;
  }

  async join(
    name: string,
    data: string,
    offer: RTCSessionDescriptionInit,
    disableVidAutoSub: boolean,
  ): Promise<RTCSessionDescriptionInit> {
    const params = { name, disableVidAutoSub, data, offer };
    const response: RTCSessionDescriptionInit = await this.call(HMSSignalMethod.JOIN, params);

    this.isJoinCompleted = true;
    this.pendingTrickle.forEach(({ target, candidate }) => this.trickle(target, candidate));
    this.pendingTrickle.length = 0;

    HMSLogger.d(this.TAG, `join: response=${JSON.stringify(response, null, 1)}`);
    return response;
  }

  trickle(target: HMSConnectionRole, candidate: RTCIceCandidateInit) {
    if (this.isJoinCompleted) {
      this.notify(HMSSignalMethod.TRICKLE, { target, candidate });
    } else {
      this.pendingTrickle.push({ target, candidate });
    }
  }

  async offer(desc: RTCSessionDescriptionInit, tracks: Map<string, any>): Promise<RTCSessionDescriptionInit> {
    const response = await this.call(HMSSignalMethod.OFFER, {
      desc,
      tracks: Object.fromEntries(tracks),
    });
    return response as RTCSessionDescriptionInit;
  }

  answer(desc: RTCSessionDescriptionInit) {
    this.notify(HMSSignalMethod.ANSWER, { desc });
  }

  trackUpdate(tracks: Map<string, Track>) {
    this.notify(HMSSignalMethod.TRACK_UPDATE, { version: '1.0', tracks: Object.fromEntries(tracks) });
  }

  async broadcast(message: Message) {
    await this.call(HMSSignalMethod.BROADCAST, { version: '1.0', ...message.toSignalParams() });
  }

  leave() {
    this.notify(HMSSignalMethod.LEAVE, { version: '1.0' });
  }

  async endRoom(lock: boolean, reason: string) {
    await this.call(HMSSignalMethod.END_ROOM, { lock, reason });
  }

  sendEvent(event: AnalyticsEvent) {
    if (!this.isConnected) {
      throw Error(`${this.TAG} not connected. Could not send event ${event}`);
    }
    this.notify(HMSSignalMethod.ANALYTICS, event.toSignalParams());
  }

  ping(timeout: number): Promise<number> {
    const pingTime = Date.now();
    const timer: Promise<number> = new Promise(resolve => {
      setTimeout(() => {
        resolve(Date.now() - pingTime);
      }, timeout + 1);
    });
    const pongTimeDiff = this.call(HMSSignalMethod.PING, { timestamp: pingTime })
      .then(() => Date.now() - pingTime)
      .catch(() => Date.now() - pingTime);

    return Promise.race([timer, pongTimeDiff]);
  }

  async requestRoleChange(params: RequestForRoleChangeParams) {
    await this.call(HMSSignalMethod.ROLE_CHANGE_REQUEST, params);
  }

  async acceptRoleChangeRequest(params: AcceptRoleChangeParams) {
    await this.call(HMSSignalMethod.ROLE_CHANGE, params);
  }

  async requestTrackStateChange(params: TrackUpdateRequestParams) {
    await this.call(HMSSignalMethod.TRACK_UPDATE_REQUEST, params);
  }

  async requestMultiTrackStateChange(params: MultiTrackUpdateRequestParams) {
    await this.call(HMSSignalMethod.CHANGE_TRACK_MUTE_STATE_REQUEST, params);
  }

  async removePeer(params: RemovePeerRequest) {
    await this.call(HMSSignalMethod.PEER_LEAVE_REQUEST, params);
  }

  async startRTMPOrRecording(params: StartRTMPOrRecordingRequestParams) {
    await this.call(HMSSignalMethod.START_RTMP_OR_RECORDING_REQUEST, { version: '1.0', ...params });
  }

  async stopRTMPAndRecording() {
    await this.call(HMSSignalMethod.STOP_RTMP_AND_RECORDING_REQUEST, { version: '1.0' });
  }

  async startHLSStreaming(params: HLSConfig): Promise<void> {
    await this.call(HMSSignalMethod.START_HLS_STREAMING, { version: '1.0', meeting_url: params.meetingURL });
  }

  async stopHLSStreaming(): Promise<void> {
    await this.call(HMSSignalMethod.STOP_HLS_STREAMING, { version: '1.0' });
  }

  async updatePeer(params: UpdatePeerRequestParams) {
    await this.call(HMSSignalMethod.UPDATE_PEER_METADATA, { version: '1.0', ...params });
  }

  private onCloseHandler(event: CloseEvent) {
    HMSLogger.d(`Websocket closed code=${event.code}`);
    this.isConnected = false;
    // https://stackoverflow.com/questions/18803971/websocket-onerror-how-to-read-error-description

    // @DISCUSS: onOffline would have thrown error already.
    // if (event.code !== 1000) {
    //   HMSLogger.e(`Websocket closed code=${event.code}, reason=${event.reason}`);
    //   // 1000 code indicated `Normal Closure` [https://tools.ietf.org/html/rfc6455#section-7.4.1]
    //   const error = ErrorFactory.WebSocketConnectionErrors.WebSocketConnectionLost(
    //     HMSAction.INIT,
    //     `${event.reason} [${event.code}]`,
    //   );
    //   this.observer.onFailure(error);
    // }
  }

  private onMessageHandler(event: MessageEvent) {
    const text: string = event.data;
    const response = JSON.parse(text);

    if (response.id) {
      this.handleResponseWithId(response);
    } else if (response.method) {
      this.handleResponseWithMethod(response);
    } else {
      throw Error(`WebSocket message has no 'method' or 'id' field, message=${response}`);
    }
  }

  private handleResponseWithId(response: any) {
    /** This is a response to [call] */
    const typedResponse = response as JsonRpcResponse;
    const id: string = typedResponse.id;
    if (this.callbacks.has(id)) {
      const cb = this.callbacks.get(id)!;
      this.callbacks.delete(id);
      if (typedResponse.result) {
        cb.resolve(typedResponse.result);
      } else {
        cb.reject(typedResponse.error);
      }
    } else {
      this.observer.onNotification(typedResponse);
    }
  }

  private handleResponseWithMethod(response: any) {
    switch (response.method) {
      case HMSSignalMethod.OFFER:
        this.observer.onOffer(response.params);
        break;
      case HMSSignalMethod.TRICKLE:
        this.observer.onTrickle(response.params);
        break;
      case HMSSignalMethod.SERVER_ERROR:
        this.observer.onServerError(
          ErrorFactory.WebsocketMethodErrors.ServerErrors(
            Number(response.params.code),
            HMSAction.NONE,
            response.params.message,
          ),
        );
        break;
      default:
        this.observer.onNotification(response);
        break;
    }
  }

  private async pingPongLoop(id: number) {
    const pingTimeout = window.HMS?.PING_TIMEOUT || DEFAULT_SIGNAL_PING_TIMEOUT;
    if (this.isConnected) {
      const pongTimeDiff = await this.ping(pingTimeout);
      if (pongTimeDiff > pingTimeout) {
        HMSLogger.d(this.TAG, 'Pong timeout', { id });
        if (this.id === id) {
          this.isConnected = false;
        }
      } else {
        setTimeout(() => this.pingPongLoop(id), window.HMS?.PING_INTERVAL || DEFAULT_SIGNAL_PING_INTERVAL);
      }
    }
  }
}
