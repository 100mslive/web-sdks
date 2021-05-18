import { v4 as uuid } from 'uuid';
import { ISignal, Track } from '../ISignal';
import { ISignalEventsObserver } from '../ISignalEventsObserver';
import { HMSConnectionRole, HMSTrickle } from '../../connection/model';
import { JsonRpcRequest } from './models';
import { HMSExceptionBuilder } from '../../error/HMSException';
import { PromiseCallbacks } from '../../utils/promise';
import HMSLogger from '../../utils/logger';
import HMSErrors from '../../error/HMSErrors';
import HMSMessage from '../../interfaces/message';

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

  constructor(observer: ISignalEventsObserver) {
    this.observer = observer;
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
    return new Promise((resolve) => {
      this.socket = new WebSocket(uri); // @DISCUSS: Inject WebSocket as a dependency so that it can be easier to mock and test
      const openHandler = () => {
        resolve();
        this.socket!.removeEventListener('open', openHandler);
      };

      this.socket.addEventListener('open', openHandler);
      this.socket.addEventListener('close', (e) => {
        // https://stackoverflow.com/questions/18803971/websocket-onerror-how-to-read-error-description
        if (e.code !== 1000) {
          // 1000 code indicated `Normal Closure` [https://tools.ietf.org/html/rfc6455#section-7.4.1]
          const error = new HMSExceptionBuilder(HMSErrors.ConnectionLost).errorInfo(`${e.reason} [${e.code}]`).build();
          this.observer.onFailure(error);
        }
      });
      this.socket.addEventListener('message', (event) => this.onMessageHandler(event.data));
    });
  }

  async close(): Promise<void> {
    const p = new Promise<void>((resolve) => {
      this.socket!.addEventListener('close', () => resolve());
    });

    // For `1000` Refer: https://tools.ietf.org/html/rfc6455#section-7.4.1
    this.socket!.close(1000, 'Normal Close');
    return p;
  }

  async join(
    name: string,
    data: string,
    offer: RTCSessionDescriptionInit,
    disableVidAutoSub: boolean,
  ): Promise<RTCSessionDescriptionInit> {
    const params = { name, disableVidAutoSub, data, offer };
    const response: RTCSessionDescriptionInit = await this.call('join', params);

    this.isJoinCompleted = true;
    this.pendingTrickle.forEach(({ target, candidate }) => this.trickle(target, candidate));
    this.pendingTrickle.length = 0;

    HMSLogger.d(this.TAG, `join: response=${JSON.stringify(response, null, 1)}`);
    return response;
  }

  trickle(target: HMSConnectionRole, candidate: RTCIceCandidateInit) {
    if (this.isJoinCompleted) {
      this.notify('trickle', { target, candidate });
    } else {
      this.pendingTrickle.push({ target, candidate });
    }
  }

  async offer(desc: RTCSessionDescriptionInit, tracks: Map<string, any>): Promise<RTCSessionDescriptionInit> {
    const response = await this.call('offer', {
      desc,
      tracks: Object.fromEntries(tracks),
    });
    return response as RTCSessionDescriptionInit;
  }

  answer(desc: RTCSessionDescriptionInit) {
    this.notify('answer', { desc });
  }

  trackUpdate(tracks: Map<string, Track>) {
    HMSLogger.d(this.TAG, 'Track Update: ', { tracks: Object.fromEntries(tracks) });
    this.notify('track-update', { version: '1.0', tracks: Object.fromEntries(tracks) });
  }

  broadcast(message: HMSMessage) {
    // Refer https://www.notion.so/100ms/Biz-Client-Communication-V2-0e93bf0fcd0d46d49e96099d498112d8#b6dd01c8e258442fb50c11c87e4581fb
    this.notify('broadcast', { version: '1.0', info: message });
  }

  recordStart() {}

  recordEnd() {}

  leave() {
    this.notify('leave', { version: '1.0' });
  }

  analytics() {}

  private onMessageHandler(text: string) {
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
          const ex = HMSExceptionBuilder.from(error.code, error.message).build();
          cb.reject(ex);
        }
      } else {
        this.observer.onNotification(response);
      }
    } else if (response.hasOwnProperty('method')) {
      if (response.method === 'offer') {
        this.observer.onOffer(response.params);
      } else if (response.method === 'trickle') {
        this.observer.onTrickle(response.params);
      } else {
        this.observer.onNotification(response);
      }
    } else throw Error(`WebSocket message has no 'method' or 'id' field, message=${response}`);
  }
}
