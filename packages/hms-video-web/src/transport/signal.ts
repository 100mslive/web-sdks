import ISignal from './interfaces/signal';
import { EventEmitter } from 'events';

export class Signal extends EventEmitter implements ISignal {
  send() {
    console.log('SEND');
  }
}
