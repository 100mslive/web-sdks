import { EventEmitter2 as EventEmitter } from 'eventemitter2';

/**
 * Typed Event Emitter Reference:
 * https://rjzaworski.com/2019/10/event-emitters-in-typescript#a-typescript-event-emitter-interface
 */

export type EventMap = Record<string, any>;

export type EventKey<T extends EventMap> = string & keyof T;
export type EventReceiver<T> = (params: T) => void;

// interface Emitter<T extends EventMap> {
//   on<K extends EventKey<T>>(eventName: K, fn: EventReceiver<T[K]>): void;
//   off<K extends EventKey<T>>(eventName: K, fn: EventReceiver<T[K]>): void;
//   emit<K extends EventKey<T>>(eventName: K, params: T[K]): void;
// }

export abstract class TypedEventEmitter<T extends EventMap> extends EventEmitter {
  on<K extends EventKey<T>>(eventName: K, fn: EventReceiver<T[K]>) {
    return super.on(eventName, fn);
  }

  off<K extends EventKey<T>>(eventName: K, fn: EventReceiver<T[K]>) {
    return super.off(eventName, fn);
  }

  emit<K extends EventKey<T>>(eventName: K, params: T[K]) {
    return super.emit(eventName, params);
  }

  listeners<K extends EventKey<T>>(eventName: K): EventReceiver<T[K]>[] {
    return super.listeners(eventName) as EventReceiver<T[K]>[];
  }
}
