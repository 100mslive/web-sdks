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
  HLSRequestParams,
  BroadcastResponse,
  HLSTimedMetadataParams,
} from '../interfaces';
import { HMSConnectionRole, HMSTrickle } from '../../connection/model';
import { convertSignalMethodtoErrorAction, HMSSignalMethod, JsonRpcRequest, JsonRpcResponse } from './models';
import { PromiseCallbacks } from '../../utils/promise';
import HMSLogger from '../../utils/logger';
import { ErrorFactory, HMSAction } from '../../error/ErrorFactory';
import AnalyticsEvent from '../../analytics/AnalyticsEvent';
import {
  DEFAULT_SIGNAL_PING_TIMEOUT,
  DEFAULT_SIGNAL_PING_INTERVAL,
  PONG_RESPONSE_TIMES_SIZE,
} from '../../utils/constants';
import Message from '../../sdk/models/HMSMessage';
import { HMSException } from '../../error/HMSException';
import { Queue } from '../../utils/queue';
import { isPageHidden } from '../../utils/support';
import { sleep } from '../../utils/timer-utils';

export default class JsonRpcSignal implements ISignal {
  readonly TAG = '[ SIGNAL ]: ';
  readonly observer: ISignalEventsObserver;
  readonly pongResponseTimes = new Queue<number>(PONG_RESPONSE_TIMES_SIZE);

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

  public setIsConnected(newValue: boolean, reason = '') {
    HMSLogger.d(this.TAG, `isConnected set id: ${this.id}, oldValue: ${this._isConnected}, newValue: ${newValue} }`);
    if (this._isConnected === newValue) {
      return;
    }

    if (this._isConnected && !newValue) {
      // went offline
      this._isConnected = newValue;
      this.observer.onOffline(reason);
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
      this.setIsConnected(false, 'Window network offline');
    });

    window.addEventListener('online', () => {
      HMSLogger.d(this.TAG, 'Window network online');
      this.observer.onNetworkOnline();
    });

    this.onCloseHandler = this.onCloseHandler.bind(this);
    this.onMessageHandler = this.onMessageHandler.bind(this);
  }

  getPongResponseTimes() {
    return this.pongResponseTimes.toList();
  }

  private async internalCall<T>(method: string, params: any): Promise<T> {
    const id = uuid();
    const message = { method, params, id, jsonrpc: '2.0' } as JsonRpcRequest;

    this.socket?.send(JSON.stringify(message));

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

    this.socket?.send(JSON.stringify(message));
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
        /**
         * there was an error received from websocket leading to disconnection, this can happen either if server
         * disconnects the websocket for some reason, there is a network disconnect or a firewall/antivirus on user's
         * device is breaking the websocket connecting(which can happen even after a successful connect).
         */
        HMSLogger.e(this.TAG, 'Error from websocket', error);
        reject(
          ErrorFactory.WebSocketConnectionErrors.FailedToConnect(
            HMSAction.JOIN,
            `Error opening websocket connection - ${error}`,
          ),
        );
      };
      this.socket.addEventListener('error', errorListener);

      const openHandler = () => {
        resolve();
        this.setIsConnected(true);
        this.id++;
        this.socket?.removeEventListener('open', openHandler);
        this.socket?.removeEventListener('error', errorListener);
        this.pingPongLoop(this.id);
      };

      this.socket.addEventListener('open', openHandler);
      this.socket.addEventListener('close', this.onCloseHandler);
      this.socket.addEventListener('message', this.onMessageHandler);
    });
  }

  async close(): Promise<void> {
    // For `1000` Refer: https://tools.ietf.org/html/rfc6455#section-7.4.1
    if (this.socket) {
      this.socket.close(1000, 'Normal Close');
      this.setIsConnected(false, 'code: 1000, normal websocket close');
      this.socket.removeEventListener('close', this.onCloseHandler);
      this.socket.removeEventListener('message', this.onMessageHandler);
    } else {
      this.setIsConnected(false, 'websocket not connected yet');
    }
  }

  async join(
    name: string,
    data: string,
    disableVidAutoSub: boolean,
    serverSubDegrade: boolean,
    offer?: RTCSessionDescriptionInit,
  ): Promise<RTCSessionDescriptionInit> {
    if (!this.isConnected) {
      throw ErrorFactory.WebSocketConnectionErrors.WebSocketConnectionLost(
        HMSAction.JOIN,
        'Failed to send join over WS connection',
      );
    }
    const params = { name, disableVidAutoSub, data, offer, server_sub_degrade: serverSubDegrade };
    const response: RTCSessionDescriptionInit = await this.internalCall(HMSSignalMethod.JOIN, params);

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
    return await this.call<BroadcastResponse>(HMSSignalMethod.BROADCAST, {
      version: '1.0',
      ...message.toSignalParams(),
    });
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
    const pongTimeDiff = this.internalCall(HMSSignalMethod.PING, { timestamp: pingTime })
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

  async startHLSStreaming(params: HLSRequestParams): Promise<void> {
    await this.call(HMSSignalMethod.START_HLS_STREAMING, { version: '1.0', ...params });
  }

  async stopHLSStreaming(params?: HLSRequestParams): Promise<void> {
    await this.call(HMSSignalMethod.STOP_HLS_STREAMING, { version: '1.0', ...params });
  }

  async sendHLSTimedMetadata(params?: HLSTimedMetadataParams): Promise<void> {
    await this.call(HMSSignalMethod.HLS_TIMED_METADATA, { version: '1.0', ...params });
  }

  async updatePeer(params: UpdatePeerRequestParams) {
    await this.call(HMSSignalMethod.UPDATE_PEER_METADATA, { version: '1.0', ...params });
  }

  private onCloseHandler(event: CloseEvent) {
    HMSLogger.d(`Websocket closed code=${event.code}`);
    this.setIsConnected(false, `code: ${event.code}${event.code !== 1000 ? ', unexpected websocket close' : ''}`);
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
      case HMSSignalMethod.SERVER_WARNING:
        HMSLogger.w(this.TAG, response.params);
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
      this.pongResponseTimes.enqueue(pongTimeDiff);
      if (pongTimeDiff > pingTimeout) {
        HMSLogger.d(this.TAG, `Pong timeout ${id}, pageHidden=${isPageHidden()}`);
        if (this.id === id) {
          this.setIsConnected(false, 'ping pong failure');
        }
      } else {
        setTimeout(() => this.pingPongLoop(id), window.HMS?.PING_INTERVAL || DEFAULT_SIGNAL_PING_INTERVAL);
      }
    }
  }

  private async call<T>(method: HMSSignalMethod, params: Record<string, any>): Promise<T> {
    const MAX_RETRIES = 3;
    let error: HMSException = ErrorFactory.WebsocketMethodErrors.ServerErrors(500, method, `Default ${method} error`);

    for (let i = 0; i < MAX_RETRIES; i++) {
      try {
        HMSLogger.d(this.TAG, `Try number ${i + 1} sending ${method}`, params);
        return await this.internalCall(method, params);
      } catch (err) {
        error = err as HMSException;
        HMSLogger.e(this.TAG, `Failed sending ${method}`, { method, try: i + 1, params, error });
        const shouldRetry = parseInt(`${error.code / 100}`) === 5 || error.code === 429;
        if (!shouldRetry) {
          break;
        }

        const delay = (2 + Math.random() * 2) * 1000;
        await sleep(delay);
      }
    }
    HMSLogger.e(`Sending ${method} over WS failed after ${MAX_RETRIES} retries`, { method, params, error });
    throw error;
  }
}
