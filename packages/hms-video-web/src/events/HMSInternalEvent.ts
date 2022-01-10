import { EventEmitter2 as EventEmitter } from 'eventemitter2';

export class HMSInternalEvent<T> {
  constructor(private eventName: string, private eventEmitter: EventEmitter) {}

  publish = (event?: T) => {
    this.eventEmitter.emit(this.eventName, event);
  };
  subscribe = (fn: (event: T) => void | Promise<void>) => {
    this.eventEmitter.on(this.eventName, fn);
  };
  subscribeOnce = (fn: (event: T) => void | Promise<void>) => {
    this.eventEmitter.once(this.eventName, fn);
  };
  unsubscribe = (fn: (event: T) => void | Promise<void>) => {
    this.eventEmitter.off(this.eventName, fn);
  };
  removeAllListeners = () => {
    this.eventEmitter.removeAllListeners(this.eventName);
  };

  getListeners = () => this.eventEmitter.listeners(this.eventName);
}
