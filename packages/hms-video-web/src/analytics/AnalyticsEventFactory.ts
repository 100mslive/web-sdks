import { HMSException } from '../error/HMSException';
import { HMSTrackSettings } from '../media/settings/HMSTrackSettings';
import { SelectedDevices } from '../device-manager';
import { DeviceMap } from '../interfaces';
import AnalyticsEvent from './AnalyticsEvent';
import { AnalyticsEventLevel } from './AnalyticsEventLevel';
import { IAnalyticsPropertiesProvider } from './IAnalyticsPropertiesProvider';
import { HMSRemoteVideoTrack } from '../media/tracks';

export default class AnalyticsEventFactory {
  private static KEY_REQUESTED_AT = 'requested_at';
  private static KEY_RESPONDED_AT = 'responded_at';

  static connect(
    error?: HMSException,
    requestedAt: Date = new Date(),
    respondedAt: Date = new Date(),
    endpoint?: string,
  ) {
    const name = this.eventNameFor('connect', error === undefined);
    const level = error ? AnalyticsEventLevel.ERROR : AnalyticsEventLevel.INFO;

    const properties = this.getPropertiesWithError(
      {
        [this.KEY_REQUESTED_AT]: requestedAt?.getTime(),
        [this.KEY_RESPONDED_AT]: respondedAt?.getTime(),
        endpoint,
      },
      error,
    );

    return new AnalyticsEvent({ name, level, properties });
  }

  static disconnect(error?: HMSException) {
    const name = 'disconnected';
    const level = error ? AnalyticsEventLevel.ERROR : AnalyticsEventLevel.INFO;
    const properties = this.getPropertiesWithError({}, error);

    return new AnalyticsEvent({ name, level, properties });
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

    return new AnalyticsEvent({ name, level, properties });
  }

  static publish({
    devices,
    settings,
    error,
  }: {
    devices?: DeviceMap;
    settings?: HMSTrackSettings;
    error?: HMSException;
  }) {
    const name = this.eventNameFor('publish', error === undefined);
    const level = error ? AnalyticsEventLevel.ERROR : AnalyticsEventLevel.INFO;
    const properties = this.getPropertiesWithError(
      {
        devices,
        audio: settings?.audio,
        video: settings?.video,
      },
      error,
    );
    return new AnalyticsEvent({
      name,
      level,
      properties,
    });
  }

  static subscribeFail(error: HMSException) {
    const name = this.eventNameFor('subscribe', false);
    const level = AnalyticsEventLevel.ERROR;
    const properties = error.toAnalyticsProperties();

    return new AnalyticsEvent({ name, level, properties });
  }

  static leave() {
    return new AnalyticsEvent({ name: 'leave', level: AnalyticsEventLevel.INFO });
  }

  static autoplayError() {
    return new AnalyticsEvent({ name: 'autoplayError', level: AnalyticsEventLevel.ERROR });
  }

  static deviceChange({
    selection,
    type,
    devices,
    error,
  }: {
    selection: Partial<SelectedDevices>;
    type?: 'change' | 'list';
    devices: DeviceMap;
    error?: HMSException;
  }) {
    const name = this.eventNameFor(error ? 'publish' : `device.${type}`, error === undefined);
    const level = error ? AnalyticsEventLevel.ERROR : AnalyticsEventLevel.INFO;
    const properties = this.getPropertiesWithError({ selection, devices }, error);
    return new AnalyticsEvent({
      name,
      level,
      properties,
    });
  }

  static performance(stats: IAnalyticsPropertiesProvider) {
    const name = 'perf.stats';
    const level = AnalyticsEventLevel.INFO;
    const properties = stats.toAnalyticsProperties();

    return new AnalyticsEvent({ name, level, properties });
  }

  static rtcStats(stats: IAnalyticsPropertiesProvider) {
    const name = 'rtc.stats';
    const level = AnalyticsEventLevel.INFO;
    const properties = stats.toAnalyticsProperties();

    return new AnalyticsEvent({ name, level, properties });
  }

  static degradationStats(track: HMSRemoteVideoTrack, isDegraded: boolean) {
    const name = 'video.degradation.stats';
    const level = AnalyticsEventLevel.INFO;
    let properties: any = {
      degradedAt: track.degradedAt,
      trackId: track.trackId,
    };

    if (!isDegraded && track.degradedAt instanceof Date) {
      // not degraded => restored
      const restoredAt = new Date();
      const duration = restoredAt.valueOf() - track.degradedAt.valueOf();
      properties = { ...properties, duration, restoredAt };
    }

    return new AnalyticsEvent({ name, level, properties });
  }

  static audioDetectionFail(error: HMSException, device?: MediaDeviceInfo): AnalyticsEvent {
    const properties = this.getPropertiesWithError({ device }, error);
    const level = AnalyticsEventLevel.ERROR;
    const name = 'audiopresence.failed';

    return new AnalyticsEvent({ name, level, properties });
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
