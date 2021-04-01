import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { Callback } from './interfaces/transport';

export default class HMSTransport extends EventEmitter {
  protected signal;

  constructor(signal) {
    super();
    this.signal = signal;
  }

  call(method: string, params: any, cb: Callback) {
    const id = uuidv4();

    this.signal.send(
      JSON.stringify({
        method,
        params,
        id,
      })
    );

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
    this.signal.send(
      JSON.stringify({
        method,
        params,
      })
    );
  }
}
