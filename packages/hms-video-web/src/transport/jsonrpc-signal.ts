import HMSSignal from './interfaces/hms-signal';
import { EventEmitter } from 'events';

export default class JsonRPCSignal extends EventEmitter implements HMSSignal {
  
  constructor() {
    super()
  }
  
  send() {
    console.log('SEND');
  }
}
