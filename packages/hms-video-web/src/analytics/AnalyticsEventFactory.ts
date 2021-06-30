import HMSException from '../error/HMSException';
import HMSTrackSettings from '../media/settings/HMSTrackSettings';
import HMSVideoTrackSettings from '../media/settings/HMSVideoTrackSettings';
import HMSTrack from '../media/tracks/HMSTrack';
import { isEmptyTrack } from '../utils/track';
import AnalyticsEvent from './AnalyticsEvent';
import { AnalyticsEventLevel } from './AnalyticsEventLevel';
import { IAnalyticsPropertiesProvider } from './IAnalyticsPropertiesProvider';

const lastTrackStateEventTimestamp: Record<'audio' | 'video', number | null> = {
  audio: null,
  video: null,
};

export default class AnalyticsEventFactory {
  private static KEY_REQUESTED_AT = 'requested_at';
  private static KEY_RESPONDED_AT = 'responded_at';

  static connect(requestedAt: Date, respondedAt: Date, endpoint: string, error?: HMSException) {
    const name = this.eventNameFor('connect', error === undefined);
    const level = error ? AnalyticsEventLevel.ERROR : AnalyticsEventLevel.INFO;

    const properties = this.getPropertiesWithError(
      {
        [this.KEY_REQUESTED_AT]: requestedAt.getTime(),
        [this.KEY_RESPONDED_AT]: respondedAt.getTime(),
        endpoint,
      },
      error,
    );

    return new AnalyticsEvent(name, level, false, properties);
  }

  static disconnect(error?: HMSException) {
    const name = this.eventNameFor('disconnect', error === undefined);
    const level = error ? AnalyticsEventLevel.ERROR : AnalyticsEventLevel.INFO;
    const properties = this.getPropertiesWithError({}, error);

    return new AnalyticsEvent(name, level, false, properties);
  }

  static join(requestedAt: Date, respondedAt: Date, error?: HMSException) {
    const name = this.eventNameFor('join', error === undefined);
    const level = error ? AnalyticsEventLevel.ERROR : AnalyticsEventLevel.INFO;

    const properties = this.getPropertiesWithError(
      {
        [this.KEY_REQUESTED_AT]: requestedAt.getTime(),
        [this.KEY_RESPONDED_AT]: respondedAt.getTime(),
      },
      error,
    );

    return new AnalyticsEvent(name, level, false, properties);
  }

  static getLocalTracks(settings?: HMSTrackSettings, track?: HMSTrack, error?: HMSException) {
    const name = this.eventNameFor('get.local.tracks', error === undefined);
    const level = error ? AnalyticsEventLevel.ERROR : AnalyticsEventLevel.INFO;
    const properties = this.getPropertiesWithError(
      {
        local_stream_id: track?.stream.id,
        ...settings?.toAnalyticsProperties(),
      },
      error,
    );

    if (track) properties.isEmpty = isEmptyTrack(track.nativeTrack);

    return new AnalyticsEvent(name, level, false, properties);
  }

  static getLocalScreen(settings?: HMSVideoTrackSettings, track?: HMSTrack, error?: HMSException) {
    const name = this.eventNameFor('get.local.screen', error === undefined);
    const level = error ? AnalyticsEventLevel.ERROR : AnalyticsEventLevel.INFO;
    const properties = this.getPropertiesWithError(
      {
        local_stream_id: track?.stream.id,
        ...settings?.toAnalyticsProperties(),
      },
      error,
    );

    return new AnalyticsEvent(name, level, false, properties);
  }

  static setSettings(settings: HMSTrackSettings, track: HMSTrack, error?: HMSException) {
    const name = this.eventNameFor('apply.constraints', error === undefined);
    const level = error ? AnalyticsEventLevel.ERROR : AnalyticsEventLevel.INFO;
    const properties = this.getPropertiesWithError(
      {
        local_stream_id: track.stream.id,
        ...settings.toAnalyticsProperties(),
      },
      error,
    );

    return new AnalyticsEvent(name, level, false, properties);
  }

  static publishFail(error: HMSException) {
    const name = this.eventNameFor('publish.connection', false);
    const level = AnalyticsEventLevel.ERROR;
    const properties = error.toAnalyticsProperties();

    return new AnalyticsEvent(name, level, false, properties);
  }

  static subscribeFail(error: HMSException) {
    const name = this.eventNameFor('subscribe.connection', false);
    const level = AnalyticsEventLevel.ERROR;
    const properties = error.toAnalyticsProperties();

    return new AnalyticsEvent(name, level, false, properties);
  }

  static trackStateChange(type: 'audio' | 'video', isMute: boolean) {
    const name = `${type}.state.change`;
    const level = AnalyticsEventLevel.INFO;
    const nowInMs = new Date().getTime();
    const stateDuration = lastTrackStateEventTimestamp[type] ? nowInMs - lastTrackStateEventTimestamp[type]! : 0;
    const properties = {
      mute: isMute ? 'true' : 'false',
      state_duration: stateDuration.toString(),
    };

    lastTrackStateEventTimestamp[type] = nowInMs;

    return new AnalyticsEvent(name, level, false, properties);
  }

  static trackAdd(track: HMSTrack) {
    const name = 'stream.add';
    const level = AnalyticsEventLevel.INFO;
    const properties = {
      remote_stream_id: track.stream.id,
    };

    return new AnalyticsEvent(name, level, false, properties);
  }

  static trackRemove(track: HMSTrack) {
    const name = 'stream.remove';
    const level = AnalyticsEventLevel.INFO;
    const properties = {
      remote_stream_id: track.stream.id,
    };

    return new AnalyticsEvent(name, level, false, properties);
  }

  static leave() {
    return new AnalyticsEvent('leave', AnalyticsEventLevel.INFO, false);
  }

  static performance(stats: IAnalyticsPropertiesProvider) {
    const name = 'perf.stats';
    const level = AnalyticsEventLevel.INFO;
    const properties = stats.toAnalyticsProperties();

    return new AnalyticsEvent(name, level, false, properties);
  }

  static rtcStats(stats: IAnalyticsPropertiesProvider) {
    const name = 'rtc.stats';
    const level = AnalyticsEventLevel.INFO;
    const properties = stats.toAnalyticsProperties();

    return new AnalyticsEvent(name, level, false, properties);
  }

  private static eventNameFor(name: string, ok: boolean) {
    const suffix = ok ? 'success' : 'failed';
    return `${name}.${suffix}`;
  }

  private static getPropertiesWithError(initialProperties: any, error?: HMSException) {
    if (error) {
      initialProperties = { ...error.toAnalyticsProperties(), ...initialProperties };
    }
    return initialProperties;
  }
}
