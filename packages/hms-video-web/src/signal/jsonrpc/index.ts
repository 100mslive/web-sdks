import {v4} from "uuid";
import {ISignal} from "../ISignal";
import {ISignalEventsObserver} from "../ISignalEventsObserver";
import {HMSTrickle} from "../../connection/model";
import {JsonRpcRequest} from "./models";
import HMSException from "../../error/HMSException";
import {PromiseCallbacks} from "../../utils/promise";

export default class JsonRpcSignal implements ISignal {
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

  private socket: WebSocket | null = null

  private callbacks = new Map<string, PromiseCallbacks<string>>();

  constructor(observer: ISignalEventsObserver) {
    this.observer = observer;
  }

  private async call<T>(method: string, params: any): Promise<T> {
    const id = v4();
    const message = {method, params, id} as JsonRpcRequest;

    console.debug(`%c[jsonrpc] Received ws message: ${JSON.stringify(message, null, 1)}`, 'color: SkyBlue');
    this.socket!.send(JSON.stringify(message));

    const response = await new Promise<string>((resolve, reject) => {
      this.callbacks.set(id, {resolve, reject});
    });

    return JSON.parse(response);
  }

  private notify(method: string, params: any) {
    const message = {method, params};

    console.debug(`%c[jsonrpc] Received ws message: ${JSON.stringify(message, null, 1)}`, 'color: SkyBlue');
    this.socket!.send(JSON.stringify(message));
  }

  open(uri: string): Promise<void> {
    return new Promise(((resolve) => {
      this.socket = new WebSocket(uri);
      const openHandler = () => {
        resolve();
        this.socket?.removeEventListener("open", openHandler);
      }

      this.socket.addEventListener("message", (event) => this.onMessageHandler(event.data));
    }))
  }

  async close(): Promise<void> {
    const p = new Promise<void>((resolve) => {
      this.socket!.addEventListener("close", () => resolve());
    });

    // For `1000` Refer: https://tools.ietf.org/html/rfc6455#section-7.4.1
    this.socket!.close(1000, "Normal Close");
    return p;
  }

  async join(sid: string, uid: string, offer: RTCSessionDescriptionInit, info: Object): Promise<RTCSessionDescriptionInit> {
    const params = {sid, uid, offer, info};
    const response = await this.call("join", params) as RTCSessionDescriptionInit;

    this.isJoinCompleted = true;
    this.pendingTrickle.forEach((trickle) => this.trickle(trickle));
    this.pendingTrickle.length = 0;

    return response;
  }

  async offer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    return await this.call("offer", offer) as RTCSessionDescriptionInit;
  }

  answer(answer: RTCSessionDescriptionInit) {
    this.notify("answer", answer);
  }

  trickle(trickle: HMSTrickle) {
    if (this.isJoinCompleted) {
      this.notify("trickle", trickle);
    } else {
      this.pendingTrickle.push(trickle);
    }
  }

  private onMessageHandler(text: string) {
    console.debug(`%c[jsonrpc] Received ws message: ${JSON.stringify(text, null, 1)}`, 'color: SkyBlue');
    const response = JSON.parse(text);

    if (response.id) {
      /** This is a response to [call] */
      const id: string = response.id;
      if (this.callbacks.has(id)) {
        const cb = this.callbacks.get(id)!;
        this.callbacks.delete(id);
        if (response.result) {
          cb.resolve(JSON.stringify(response.result));
        } else {
          const ex = new HMSException.Builder(response.code, response.message).build();
          cb.reject(ex);
        }
      } else {
        this.observer.onNotification(response);
      }
    } else if (response.method) {
      if (response.method === "offer") {
        this.observer.onOffer(response.params)
      } else if (response.method === "trickle") {
        this.observer.onTrickle(response.params)
      } else {
        this.observer.onNotification(response);
      }
    } else throw Error(`WebSocket message has no 'method' or 'id' field, message=${response}`)
  }
}