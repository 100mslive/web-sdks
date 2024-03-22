import { PublishAnalyticPayload, SubscribeAnalyticPayload } from './stats/interfaces';
import { AdditionalAnalyticsProperties } from './AdditionalAnalyticsProperties';
import AnalyticsEvent from './AnalyticsEvent';
import { AnalyticsEventLevel } from './AnalyticsEventLevel';
import { IAnalyticsPropertiesProvider } from './IAnalyticsPropertiesProvider';
import { HMSException } from '../error/HMSException';
import { DeviceMap, SelectedDevices } from '../interfaces';
import { HMSTrackSettings } from '../media/settings/HMSTrackSettings';
import { HMSRemoteVideoTrack } from '../media/tracks/HMSRemoteVideoTrack';

export default class AnalyticsEventFactory {
  private static KEY_REQUESTED_AT = 'requested_at';
  private static KEY_RESPONDED_AT = 'responded_at';

  static connect(
    error?: Error,
    additionalProperties?: AdditionalAnalyticsProperties,
    requestedAt: Date = new Date(),
    respondedAt: Date = new Date(),
    endpoint?: string,
  ) {
    const name = this.eventNameFor('connect', error === undefined);
    const level = error ? AnalyticsEventLevel.ERROR : AnalyticsEventLevel.INFO;

    const properties = this.getPropertiesWithError(
      {
        ...additionalProperties,
        [this.KEY_REQUESTED_AT]: requestedAt?.getTime(),
        [this.KEY_RESPONDED_AT]: respondedAt?.getTime(),
        endpoint,
      },
      error,
    );

    return new AnalyticsEvent({ name, level, properties });
  }

  static disconnect(error?: Error, additionalProperties?: AdditionalAnalyticsProperties) {
    const name = 'disconnected';
    const level = error ? AnalyticsEventLevel.ERROR : AnalyticsEventLevel.INFO;
    const properties = this.getPropertiesWithError(additionalProperties, error);

    return new AnalyticsEvent({ name, level, properties });
  }

  static preview({
    error,
    ...props
  }: {
    error?: Error;
    time?: number;
    init_response_time?: number;
    ws_connect_time?: number;
    on_policy_change_time?: number;
    local_audio_track_time?: number;
    local_video_track_time?: number;
  }) {
    const name = this.eventNameFor('preview', error === undefined);
    const level = error ? AnalyticsEventLevel.ERROR : AnalyticsEventLevel.INFO;
    const properties = this.getPropertiesWithError(props, error);

    return new AnalyticsEvent({ name, level, properties });
  }

  static join({
    error,
    ...props
  }: {
    error?: Error;
    is_preview_called?: boolean;
    start?: Date;
    end?: Date;
    time?: number;
    init_response_time?: number;
    ws_connect_time?: number;
    on_policy_change_time?: number;
    local_audio_track_time?: number;
    local_video_track_time?: number;
    retries_join?: number;
  }) {
    const name = this.eventNameFor('join', error === undefined);
    const level = error ? AnalyticsEventLevel.ERROR : AnalyticsEventLevel.INFO;

    const properties = this.getPropertiesWithError({ ...props, is_preview_called: !!props.is_preview_called }, error);

    return new AnalyticsEvent({ name, level, properties });
  }

  static publish({ devices, settings, error }: { devices?: DeviceMap; settings?: HMSTrackSettings; error?: Error }) {
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

  static hlsPlayerError(error: HMSException) {
    return new AnalyticsEvent({
      name: 'hlsPlayerError',
      level: AnalyticsEventLevel.ERROR,
      properties: this.getErrorProperties(error),
    });
  }
  static subscribeFail(error: Error) {
    const name = this.eventNameFor('subscribe', false);
    const level = AnalyticsEventLevel.ERROR;
    const properties = this.getErrorProperties(error);

    return new AnalyticsEvent({ name, level, properties });
  }

  static leave() {
    return new AnalyticsEvent({ name: 'leave', level: AnalyticsEventLevel.INFO });
  }

  static autoplayError() {
    return new AnalyticsEvent({ name: 'autoplayError', level: AnalyticsEventLevel.ERROR });
  }

  static audioPlaybackError(error: HMSException) {
    return new AnalyticsEvent({
      name: 'audioPlaybackError',
      level: AnalyticsEventLevel.ERROR,
      properties: this.getErrorProperties(error),
    });
  }

  static deviceChange({
    isUserSelection,
    selection,
    type,
    devices,
    error,
  }: {
    isUserSelection?: boolean;
    selection: Partial<SelectedDevices>;
    type?: 'change' | 'list' | 'audioInput' | 'audioOutput' | 'video';
    devices: DeviceMap;
    error?: Error;
  }) {
    const name = this.eventNameFor(error ? 'publish' : `device.${type}`, error === undefined);
    const level = error ? AnalyticsEventLevel.ERROR : AnalyticsEventLevel.INFO;
    const properties = this.getPropertiesWithError({ selection, devices, isUserSelection }, error);
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

  static rtcStatsFailed(error: HMSException) {
    const name = 'rtc.stats.failed';
    const level = AnalyticsEventLevel.ERROR;

    return new AnalyticsEvent({ name, level, properties: this.getErrorProperties(error) });
  }

  /**
   * TODO: remove once everything is switched to server side degradation, this
   * event can be handled on server side as well.
   */
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

  static audioDetectionFail(error: Error, device?: MediaDeviceInfo): AnalyticsEvent {
    const properties = this.getPropertiesWithError({ device }, error);
    const level = AnalyticsEventLevel.ERROR;
    const name = 'audiopresence.failed';

    return new AnalyticsEvent({ name, level, properties });
  }

  static previewNetworkQuality(properties: { downLink?: string; score?: number; error?: string }) {
    return new AnalyticsEvent({
      name: 'perf.networkquality.preview',
      level: properties.error ? AnalyticsEventLevel.ERROR : AnalyticsEventLevel.INFO,
      properties,
    });
  }

  static publishStats(properties: PublishAnalyticPayload) {
    return new AnalyticsEvent({
      name: 'publisher.stats',
      level: AnalyticsEventLevel.INFO,
      properties,
    });
  }

  static subscribeStats(properties: SubscribeAnalyticPayload) {
    return new AnalyticsEvent({
      name: 'subscriber.stats',
      level: AnalyticsEventLevel.INFO,
      properties,
    });
  }

  static getKrispUsage(duration: number) {
    return new AnalyticsEvent({
      name: 'krisp.usage',
      level: AnalyticsEventLevel.INFO,
      properties: { duration },
    });
  }

  private static eventNameFor(name: string, ok: boolean) {
    const suffix = ok ? 'success' : 'failed';
    return `${name}.${suffix}`;
  }

  private static getPropertiesWithError(initialProperties: any, error?: Error) {
    const errorProperties = this.getErrorProperties(error);
    initialProperties = { ...errorProperties, ...initialProperties };
    return initialProperties;
  }

  private static getErrorProperties(error?: Error): Record<string, any> {
    if (error) {
      return error instanceof HMSException
        ? error.toAnalyticsProperties()
        : {
            error_name: error.name,
            error_message: error.message,
            error_description: error.cause,
          };
    } else {
      return {};
    }
  }
}
