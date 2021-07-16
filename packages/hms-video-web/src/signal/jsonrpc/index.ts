import { v4 as uuid } from 'uuid';
import { ISignal, Track } from '../ISignal';
import { ISignalEventsObserver } from '../ISignalEventsObserver';
import { HMSConnectionRole, HMSTrickle } from '../../connection/model';
import { HMSSignalMethod, JsonRpcRequest } from './models';
import { PromiseCallbacks } from '../../utils/promise';
import HMSLogger from '../../utils/logger';
import { HMSMessage } from '../../interfaces/message';
import { ErrorFactory, HMSAction } from '../../error/ErrorFactory';
import AnalyticsEvent from '../../analytics/AnalyticsEvent';
import { DEFAULT_SIGNAL_PING_TIMEOUT, SIGNAL_PING_INTERVAL } from '../../utils/constants';

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
  private isJoinCompleted: boolean = false;
  private pendingTrickle: Array<HMSTrickle> = [];

  private socket: WebSocket | null = null;

  private callbacks = new Map<string, PromiseCallbacks<string>>();

  private _isConnected: boolean = false;

  public get isConnected(): boolean {
    return this._isConnected;
  }

  private id = 0;

  public set isConnected(newValue: boolean) {
    HMSLogger.d(this.TAG, 'isConnected set', { id: this.id, old: this._isConnected, new: newValue });
    if (this._isConnected === newValue) return;

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
    const message = { method, params, id } as JsonRpcRequest;

    this.socket!.send(JSON.stringify(message));

    const response = await new Promise<string>((resolve, reject) => {
      this.callbacks.set(id, { resolve, reject });
    });

    return JSON.parse(response);
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
        this.pingPongLoop(this.id);
      };

      this.socket.addEventListener('open', openHandler);
      this.socket.addEventListener('close', this.onCloseHandler);
      this.socket.addEventListener('message', this.onMessageHandler);
    });
  }

  async close(): Promise<void> {
    const p = new Promise<void>((resolve) => {
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

  broadcast(message: HMSMessage) {
    this.notify(HMSSignalMethod.BROADCAST, { version: '1.0', info: message });
  }

  recordStart() {}

  recordEnd() {}

  leave() {
    this.notify(HMSSignalMethod.LEAVE, { version: '1.0' });
  }

  sendEvent(event: AnalyticsEvent) {
    if (!this.isConnected) {
      throw Error(`${this.TAG} not connected. Could not send event ${event}`);
    }
    this.notify(HMSSignalMethod.ANALYTICS, event.toParams());
  }

  ping(timeout: number): Promise<number> {
    const pingTime = Date.now();
    const timer: Promise<number> = new Promise((resolve) => {
      setTimeout(() => {
        resolve(Date.now() - pingTime);
      }, timeout + 1);
    });
    const pongTimeDiff = this.call(HMSSignalMethod.PING, { timestamp: pingTime })
      .then(() => Date.now() - pingTime)
      .catch(() => Date.now() - pingTime);

    return Promise.race([timer, pongTimeDiff]);
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

    if (response.hasOwnProperty('id')) {
      /** This is a response to [call] */
      const id: string = response.id;
      if (this.callbacks.has(id)) {
        const cb = this.callbacks.get(id)!;
        this.callbacks.delete(id);
        if (response.result) {
          cb.resolve(JSON.stringify(response.result));
        } else {
          const error = response.error;
          const ex =
            error &&
            ErrorFactory.WebsocketMethodErrors.ServerErrors(
              Number(error.code),
              HMSAction.JOIN,
              `${error.message} [json: ${text}]`,
            );
          cb.reject(ex);
        }
      } else {
        this.observer.onNotification(response);
      }
    } else if (response.hasOwnProperty('method')) {
      if (response.method === HMSSignalMethod.OFFER) {
        this.observer.onOffer(response.params);
      } else if (response.method === HMSSignalMethod.TRICKLE) {
        this.observer.onTrickle(response.params);
      } else if (response.method === HMSSignalMethod.SERVER_ERROR) {
        this.observer.onServerError(
          ErrorFactory.WebsocketMethodErrors.ServerErrors(
            Number(response.params.code),
            HMSAction.JOIN,
            response.params.message,
          ),
        );
      } else {
        this.observer.onNotification(response);
      }
    } else throw Error(`WebSocket message has no 'method' or 'id' field, message=${response}`);
  }

  private async pingPongLoop(id: number) {
    const pingTimeout = DEFAULT_SIGNAL_PING_TIMEOUT;
    if (this.isConnected) {
      const pongTimeDiff = await this.ping(pingTimeout);
      if (pongTimeDiff > pingTimeout) {
        HMSLogger.d(this.TAG, 'Pong timeout', { id });
        if (this.id === id) {
          this.isConnected = false;
        }
      } else {
        setTimeout(() => this.pingPongLoop(id), SIGNAL_PING_INTERVAL);
      }
    }
  }
}
