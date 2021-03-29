import { EventEmitter } from 'events';

interface SignalRequest {
  method: string;
}
interface SignalResponse {}

export default interface Signal extends EventEmitter {
  send(request: SignalRequest): void;
}
