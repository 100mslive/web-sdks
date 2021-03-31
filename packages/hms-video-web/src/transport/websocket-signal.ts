import Signal from './interfaces/signal';
import { EventEmitter } from 'events';

export class WebsocketSignal extends EventEmitter implements Signal {
  
  constructor() {
    super()
  }
  
  send() {
    console.log('SEND');
  }
}
