export type HMSNotificationCallback = (e: any) => void;

type HMSListener = Array<HMSNotificationCallback>;

export class EventTargetPolyfill {
  private listeners: Record<string, HMSListener>;
  constructor() {
    this.listeners = {};
  }

  addEventListener = (type: string, callback: (e: any) => void) => {
    if (!(type in this.listeners)) {
      this.listeners[type] = [];
    }
    this.listeners[type].push(callback);
  };

  removeEventListener = (type: string, callback: (e: any) => void) => {
    if (!(type in this.listeners)) {
      return;
    }
    const stack = this.listeners[type];
    for (let i = 0, l = stack.length; i < l; i++) {
      if (stack[i] === callback) {
        stack.splice(i, 1);
        return;
      }
    }
  };

  dispatchEvent = (event: any) => {
    if (!(event.type in this.listeners)) {
      return true;
    }
    const stack = this.listeners[event.type].slice();
    for (let i = 0, l = stack.length; i < l; i++) {
      stack[i].call(this, event);
    }
    return !event.defaultPrevented;
  };
}

export const getEventTarget = () => {
  // Polyfill if EventTarget constructor is not supported
  if (typeof EventTarget.constructor !== 'function') {
    return EventTargetPolyfill;
  }
  return EventTarget;
};
