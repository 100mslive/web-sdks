import AnalyticsEvent from './AnalyticsEvent';
import { AnalyticsEventLevel } from './AnalyticsEventLevel';
import { HMSException } from '../error/HMSException';

export default class MediaPluginsAnalyticsFactory {
  static failure(pluginName: string, error: HMSException) {
    const name = 'mediaPlugin.failed';
    const level = AnalyticsEventLevel.ERROR;
    const properties = { plugin_name: pluginName, ...error.toAnalyticsProperties() };

    return new AnalyticsEvent({ name, level, properties });
  }

  static audioPluginFailure(pluginName: string, sampleRate: number, error: HMSException) {
    const name = 'mediaPlugin.failed';
    const level = AnalyticsEventLevel.ERROR;
    const properties = { plugin_name: pluginName, sampleRate: sampleRate, ...error.toAnalyticsProperties() };

    return new AnalyticsEvent({ name, level, properties });
  }

  static audioPluginStats({
    pluginName,
    duration,
    loadTime,
    sampleRate,
  }: {
    pluginName: string;
    duration: number;
    loadTime: number;
    sampleRate: number;
  }) {
    const name = 'mediaPlugin.stats';
    const level = AnalyticsEventLevel.INFO;
    const properties = {
      plugin_name: pluginName,
      duration: duration,
      load_time: loadTime,
      sampleRate: sampleRate,
    };
    return new AnalyticsEvent({ name, level, properties });
  }

  static added(pluginName: string, added_at: number) {
    const name = 'mediaPlugin.added';
    const level = AnalyticsEventLevel.INFO;
    const properties = {
      plugin_name: pluginName,
      added_at: added_at,
    };
    return new AnalyticsEvent({ name, level, properties });
  }

  static stats({
    pluginName,
    duration,
    loadTime,
    avgPreProcessingTime,
    avgProcessingTime,
    inputFrameRate,
    pluginFrameRate,
  }: {
    pluginName: string;
    duration: number;
    loadTime: number;
    avgPreProcessingTime?: number;
    avgProcessingTime?: number;
    inputFrameRate?: number;
    pluginFrameRate?: number;
  }) {
    const name = 'mediaPlugin.stats';
    const level = AnalyticsEventLevel.INFO;
    const properties = {
      plugin_name: pluginName,
      duration: duration,
      load_time: loadTime,
      avg_preprocessing_time: avgPreProcessingTime,
      avg_processing_time: avgProcessingTime,
      input_frame_rate: inputFrameRate,
      plugin_frame_rate: pluginFrameRate,
    };
    return new AnalyticsEvent({ name, level, properties });
  }
}
