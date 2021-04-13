import { EventEmitter } from 'events';
// import { v4 as uuidv4 } from 'uuid';
import { Callback, JoiningParams } from './interfaces/transport';
import log from "loglevel"
import fetch from "node-fetch"

type InitConfig = {
  endpoint: string,
  rtcConfiguration: any
}

export default class HMSTransport extends EventEmitter {
  // protected signal;
  // pc: RTCPeerConnection

  join(joiningParams: JoiningParams, cb: Callback) {
    this.init().then(config => {
      const { roomId, token } = joiningParams
      const endpoint = config.endpoint
      log.debug({roomId, token, endpoint})
      cb(null , config)
    })
  }

  // call(method: string, params: any, cb: Callback) {
  //   const id = uuidv4();

  //   this.signal.send(
  //     JSON.stringify({
  //       method,
  //       params,
  //       id,
  //     })
  //   );

  //   const messageHandler = (event: MessageEvent) => {
  //     const response = JSON.parse(event.data);
  //     if (response.id === id) {
  //       cb(response.error, response.result);
  //       this.signal.off('message', messageHandler);
  //     }
  //   };

  //   this.signal.on('message', messageHandler);
  // }

  // notify(method: string, params: any): void {
  //   this.signal.send(
  //     JSON.stringify({
  //       method,
  //       params,
  //     })
  //   );
  // }

  private async init() {
    const REST_ENDPOINT = "https://qa2-us.100ms.live/init" // @TODO: move to env var?

    const initResponse = await fetch(REST_ENDPOINT)
    const config: InitConfig = await initResponse.json()
    
    return config
  }
}
