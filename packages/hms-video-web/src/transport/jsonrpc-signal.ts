import Signal from './interfaces/hms-signal';
import { EventEmitter } from 'events';

export default class JsonRPCSignal extends EventEmitter implements Signal {
  
  constructor() {
    super()
  }
  
  send() {
    console.log('SEND');
  }
}
