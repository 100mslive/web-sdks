import { HMSException } from '../error/HMSException';
import { HMSTrackSettings } from '../media/settings/HMSTrackSettings';
import { DeviceList, SelectedDevices } from '../sdk/models/DeviceManager';
import AnalyticsEvent from './AnalyticsEvent';
import { AnalyticsEventLevel } from './AnalyticsEventLevel';
import { IAnalyticsPropertiesProvider } from './IAnalyticsPropertiesProvider';

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

  static publish(devices: DeviceList, settings?: HMSTrackSettings) {
    const name = this.eventNameFor('publish', true);
    const level = AnalyticsEventLevel.INFO;
    return new AnalyticsEvent({
      name,
      level,
      properties: {
        devices,
        audio: settings?.audio,
        video: settings?.video,
      },
    });
  }

  static publishFail({
    error,
    devices,
    settings,
  }: {
    error: HMSException;
    devices?: DeviceList;
    settings?: HMSTrackSettings;
  }) {
    const name = this.eventNameFor('publish', false);
    const level = AnalyticsEventLevel.ERROR;
    const properties = error.toAnalyticsProperties();

    return new AnalyticsEvent({
      name,
      level,
      properties: {
        error: properties,
        devices,
        audio: settings?.audio,
        video: settings?.video,
      },
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

  static deviceChange({
    selection,
    type,
    devices,
  }: {
    selection: SelectedDevices;
    type: 'change' | 'list';
    devices: DeviceList;
  }) {
    return new AnalyticsEvent({
      name: `device.${type}`,
      level: AnalyticsEventLevel.INFO,
      properties: {
        selection,
        devices,
      },
    });
  }

  static deviceChangeFail({
    selection,
    devices,
    error,
  }: {
    selection: InputDeviceInfo;
    error: HMSException;
    devices: DeviceList;
  }) {
    // should it be publish? we do replaceTrack internally
    const name = this.eventNameFor('publish', false);
    return new AnalyticsEvent({
      name,
      level: AnalyticsEventLevel.ERROR,
      properties: {
        selection,
        devices,
        error,
      },
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
