import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { Callback, JoiningParams } from './interfaces/transport';
import log from 'loglevel';
import fetch from 'node-fetch';
import HMSSignal from './interfaces/hms-signal';
import HMSTrack, {HMSTrackSettings} from "./interfaces/hms-track"
import Signal from "./jsonrpc-signal"

type InitConfig = {
  endpoint: string;
  rtcConfiguration: any;
};

export default class HMSTransport extends EventEmitter {
  protected signal: HMSSignal;

  constructor() {
    super();
    this.signal = new Signal(); // @TODO: How do we pass the endpoint?
  }

  join(joiningParams: JoiningParams, cb: Callback) {
    this.init().then(async config => {
      const { roomId, token } = joiningParams;
      const endpoint = config.endpoint;
      
      const offer = await this.createOffer()

      log.debug(`Joining with room ${roomId} to endpoint ${endpoint} with token ${token} with offer ${offer}`);

      this.call("join",{
        offer,
        name: "",
        data: {}
      }, cb)
      
      throw "Yet to implement"
    });
  }

  leave(cb: Callback) {
    log.debug(cb)
    throw "Yet to implement"
  }

  getLocalTracks(settings: HMSTrackSettings, cb: Callback) {
    log.debug(settings, cb)
    throw "Yet to implement"
  }

  publish(tracks: HMSTrack[], cb: Callback) {
    log.debug(tracks, cb)
    throw "Yet to implement"
  }

  unpublish(tracks: HMSTrack[], cb: Callback) {
    log.debug(tracks, cb)
    throw "Yet to implement"
  }

  call(method: string, params: any, cb: Callback) {
    const id = uuidv4();

    this.signal.send({
      method,
      params,
      id,
    });

    const messageHandler = (event: MessageEvent) => {
      const response = JSON.parse(event.data);
      if (response.id === id) {
        cb(response.error, response.result);
        this.signal.off('message', messageHandler);
      }
    };

    this.signal.on('message', messageHandler);
  }

  notify(method: string, params: any): void {
    this.signal.send({
      method,
      params,
    });
  }

  private async init() {
    const REST_ENDPOINT = 'https://qa2-us.100ms.live/init'; // @TODO: move to env var?

    const initResponse = await fetch(REST_ENDPOINT);
    const config: InitConfig = await initResponse.json();

    return config;
  }

  private async createOffer() {
    const pc = new RTCPeerConnection({})
    return pc.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true
    })
  }
}
