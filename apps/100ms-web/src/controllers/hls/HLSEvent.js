/**
 * Simple Event handler system similar to
 * DOM's synthetic events.
 */
export class HLSEvent {
  static HLS_TIMED_METADATA_LOADED = "HLS_TIMED_METADATA_LOADED";

  constructor(name) {
    this.name = name;
    this.callbacks = [];
  }
  registerCallback(callback) {
    this.callbacks.push(callback);
  }
}

export class HLSEventReactor {
  constructor() {
    this.events = {};
  }

  registerEvent = function (eventName) {
    var event = new HLSEvent(eventName);
    this.events[eventName] = event;
  };

  dispatchEvent = function (eventName, eventArgs) {
    this.events[eventName].callbacks.forEach(function (callback) {
      callback(eventArgs);
    });
  };

  addEventListener = function (eventName, callback) {
    this.events[eventName].registerCallback(callback);
  };
}
