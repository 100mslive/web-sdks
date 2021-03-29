import { EventEmitter } from 'events';
import ITransport, { Track, TrackSettings, Callback, JoiningParams } from './interfaces/transport';
import Signal from './interfaces/signal';

export default class HMSTransport extends EventEmitter implements ITransport {
  signal: Signal;

  constructor(signal: Signal) {
    super();
    this.signal = signal;
  }

  join(joiningParams: JoiningParams, callback: Callback) {
    this.signal.send({
      method: 'join',
    });
    this.signal.on('message', callback);
  }

  leave(roomId: string, callback: Callback) {}

  publish(tracks: Track[], callback: Callback) {
    this.signal.send({
      method: 'publish',
    });
  }

  unpublish() {}

  getLocalTracks(): Track[] {
    return [];
  }

  call() {}

  notify() {}
}
