import HMSLogger from '../utils/logger';

export type TimedEventName = 'init' | 'websocket-open' | 'on-policy-change' | 'local-tracks' | 'preview' | 'join';

export enum TimedEvent {
  INIT = 'init_response_time',
  WEBSOCKET_CONNECT = 'ws_connect_time',
  ON_POLICY_CHANGE = 'on_policy_change_time',
  LOCAL_TRACKS = 'local_tracks_time',
  JOIN = 'join_time',
  PREVIEW = 'preview_time',
}

export class AnalyticsTimer {
  private eventPerformanceMeasures: Partial<Record<TimedEvent, PerformanceMeasure>> = {};

  start(eventName: TimedEvent) {
    performance.mark(eventName);
  }

  end(eventName: TimedEvent) {
    try {
      this.eventPerformanceMeasures[eventName] = performance.measure(eventName, eventName);
      HMSLogger.d('[HMSPerformanceTiming]', eventName, this.eventPerformanceMeasures[eventName]?.duration);
    } catch (error) {
      HMSLogger.w('[AnalyticsTimer]', `Error in measuring performance for event ${eventName}`, { error });
    }
  }

  getTimeTaken(eventName: TimedEvent) {
    return this.eventPerformanceMeasures[eventName]?.duration;
  }

  getTimes(...eventNames: TimedEvent[]) {
    return eventNames.reduce(
      (timeObject, eventName) => ({ ...timeObject, [eventName]: this.getTimeTaken(eventName) }),
      {},
    );
  }

  cleanUp() {
    this.eventPerformanceMeasures = {};
  }
}
