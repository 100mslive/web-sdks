export type TimedEventName = 'init' | 'websocket-open' | 'on-policy-change' | 'local-tracks' | 'preview' | 'join';

export class AnalyticsTimer {
  private eventTimestamps: Partial<Record<TimedEventName, { start?: Date; end?: Date }>> = {};

  start(eventName: TimedEventName) {
    if (this.eventTimestamps[eventName]) {
      this.eventTimestamps[eventName]!.start = new Date();
    } else {
      this.eventTimestamps[eventName] = { start: new Date() };
    }
  }

  end(eventName: TimedEventName) {
    if (this.eventTimestamps[eventName]) {
      this.eventTimestamps[eventName]!.end = new Date();
    } else {
      this.eventTimestamps[eventName] = { end: new Date() };
    }
  }

  getTimeTaken(eventName: TimedEventName) {
    return (
      (this.eventTimestamps[eventName]?.end?.getTime() || 0) - (this.eventTimestamps[eventName]?.start?.getTime() || 0)
    );
  }
}
