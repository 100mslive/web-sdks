import { EventEmitter } from 'events';

interface SignalRequest {
  method: string;
  id?: string;
  params: string
}
interface SignalResponse {}

export default interface Signal extends EventEmitter {
  send(request: SignalRequest): void;
  on(message: "message", handler:Function): this
}
