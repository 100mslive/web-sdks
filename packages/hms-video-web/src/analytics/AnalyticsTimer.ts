import HMSLogger from '../utils/logger';

export type TimedEventName = 'init' | 'websocket-open' | 'on-policy-change' | 'local-tracks' | 'preview' | 'join';

export class AnalyticsTimer {
  private eventPerformanceMeasures: Partial<Record<TimedEventName, PerformanceMeasure>> = {};

  start(eventName: TimedEventName) {
    performance.mark(eventName);
  }

  end(eventName: TimedEventName) {
    this.eventPerformanceMeasures[eventName] = performance.measure(eventName, eventName);
    HMSLogger.d('[HMSPerformanceTiming]', eventName, this.eventPerformanceMeasures[eventName]?.duration);
  }

  getTimeTaken(eventName: TimedEventName) {
    return this.eventPerformanceMeasures[eventName]?.duration;
  }
}
