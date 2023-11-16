import HMSLogger from '../utils/logger';

export type TimedEventName = 'init' | 'websocket-open' | 'on-policy-change' | 'local-tracks' | 'preview' | 'join';

export enum TimedEvent {
  INIT = 'init_response_time',
  WEBSOCKET_CONNECT = 'ws_connect_time',
  ON_POLICY_CHANGE = 'on_policy_change_time',
  LOCAL_AUDIO_TRACK = 'local_audio_track_time',
  LOCAL_VIDEO_TRACK = 'local_video_track_time',
  JOIN = 'join_time',
  PREVIEW = 'preview_time',
  PEER_LIST = 'peer_list_time',
  ROOM_STATE = 'room_state_time',
  JOIN_RESPONSE = 'join_response_time',
  GET_TOKEN = 'GET_TOKEN',
}

const defaultEventNames = [
  TimedEvent.INIT,
  TimedEvent.WEBSOCKET_CONNECT,
  TimedEvent.ON_POLICY_CHANGE,
  TimedEvent.LOCAL_AUDIO_TRACK,
  TimedEvent.LOCAL_VIDEO_TRACK,
  TimedEvent.PEER_LIST,
  TimedEvent.ROOM_STATE,
  TimedEvent.JOIN_RESPONSE,
];

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
    return [...defaultEventNames, ...eventNames].reduce(
      (timeObject, eventName) => ({ ...timeObject, [eventName]: this.getTimeTaken(eventName) }),
      {},
    );
  }

  cleanup() {
    this.eventPerformanceMeasures = {};
  }
}
