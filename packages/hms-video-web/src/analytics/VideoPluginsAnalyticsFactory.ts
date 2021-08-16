import AnalyticsEvent from './AnalyticsEvent';
import { AnalyticsEventLevel } from './AnalyticsEventLevel';
import { HMSException } from '../error/HMSException';

export default class VideoPluginsAnalyticsFactory {
  static failure(pluginName: string, error: HMSException) {
    const name = 'videoPlugin.failed';
    const level = AnalyticsEventLevel.ERROR;
    const properties = { name: pluginName, error_message: error };

    return new AnalyticsEvent({ name, level, properties });
  }

  static stats({
    pluginName,
    duration,
    loadTime,
    avgPreProcessingTime,
    avgProcessingTime,
    framesSkippedPerSec,
  }: {
    pluginName: string;
    duration: number;
    loadTime: number;
    avgPreProcessingTime: number;
    avgProcessingTime: number;
    framesSkippedPerSec: number;
  }) {
    const name = 'videoPlugin.stats';
    const level = AnalyticsEventLevel.INFO;
    const properties = {
      name: pluginName,
      duration: duration,
      load_time: loadTime,
      avg_preprocessing_time: avgPreProcessingTime,
      avg_processing_time: avgProcessingTime,
      frames_skipped_ps: framesSkippedPerSec,
    };
    return new AnalyticsEvent({ name, level, properties });
  }
}
