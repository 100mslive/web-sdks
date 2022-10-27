import type { WaitForFilter, WaitForOptions } from 'eventemitter2';
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
  waitFor = (predicate: WaitForFilter) => {
    return this.eventEmitter.waitFor(this.eventName, {
      filter: predicate,
    } as WaitForOptions);
  };
  removeAllListeners = () => {
    this.eventEmitter.removeAllListeners(this.eventName);
  };
}
