import { EventEmitter } from 'events';
import Transport, { Track, TrackSettings, Callback, JoiningParams } from './interfaces/transport';
import Signal from './interfaces/signal';

const ENDPOINT = 'https://api.100ms.live/init';

export default class HMSTransport extends EventEmitter implements Transport {
  signal: Signal;

  constructor(signal: Signal) {
    super();
    this.signal = signal;
  }

  private init(token: string) {
    const uri = `${ENDPOINT}?token=${token}`;

    return fetch(uri).then((response) => response.json());
  }

  join(joiningParams: JoiningParams, callback: Callback) {
    // Get the endpoint

    // Create a websocket connection
    this.init(joiningParams.token)
      .then((endpoint) => {
        const id = "asdasd"
        
        this.signal.send({
          method: 'join',
          id,
          params: JSON.stringify({
            some: "param"
          })
        });
      })
      .catch((error) => {
        callback(error, false);
      });

    this.signal.on('message', response:  => {

    });
  }

  leave(roomId: string, callback: Callback) {}

  publish(tracks: Track[], callback: Callback) {
    this.signal.send({
      method: 'publish',
      params: JSON.stringify({
        some: "param"
      })
    });
  }

  unpublish() {}

  getLocalTracks(): Track[] {
    return [];
  }

  call() {}

  notify() {}
}
