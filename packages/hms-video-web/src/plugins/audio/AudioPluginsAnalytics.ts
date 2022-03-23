import MediaPluginsAnalyticsFactory from '../../analytics/MediaPluginsAnalyticsFactory';
import HMSLogger from '../../utils/logger';
import { ErrorFactory, HMSAction } from '../../error/ErrorFactory';
import { HMSException } from '../../error/HMSException';
import { EventBus } from '../../events/EventBus';

const TAG = 'AudioPluginsAnalytics';

export class AudioPluginsAnalytics {
  private readonly initTime: Record<string, number>;
  private readonly addedTimestamps: Record<string, number>;
  private readonly pluginAdded: Record<string, boolean>;

  constructor(private eventBus: EventBus) {
    this.initTime = {};
    this.addedTimestamps = {};
    this.pluginAdded = {};
  }

  added(name: string) {
    this.pluginAdded[name] = true;
    this.addedTimestamps[name] = Date.now();
    this.initTime[name] = 0;
  }

  removed(name: string) {
    //send stats
    if (this.pluginAdded[name]) {
      const stats = {
        pluginName: name,
        // duration in seconds
        duration: Math.floor((Date.now() - this.addedTimestamps[name]) / 1000),
        loadTime: this.initTime[name],
      };
      //send stats
      this.eventBus.analytics.publish(MediaPluginsAnalyticsFactory.audioPluginStats(stats));
      //clean the plugin details
      this.clean(name);
    }
  }

  failure(name: string, error: HMSException) {
    // send failure event
    if (this.pluginAdded[name]) {
      this.eventBus.analytics.publish(MediaPluginsAnalyticsFactory.failure(name, error));
      //clean the plugin details
      this.clean(name);
    }
  }

  async initWithTime<T>(name: string, initFn: () => Promise<T>) {
    if (this.initTime[name]) {
      HMSLogger.i(TAG, `Plugin Already loaded ${name}, time it took: ${this.initTime[name]}`);
      return;
    }
    let time: number | undefined = undefined;
    try {
      time = await this.timeInMs(initFn);
      HMSLogger.i(TAG, `Time taken for Plugin ${name} initialization : ${time}`);
    } catch (e) {
      //Failed during initialization of plugin(model loading etc...)
      const err = ErrorFactory.MediaPluginErrors.InitFailed(
        HMSAction.AUDIO_PLUGINS,
        `failed during initialization of plugin${(e as Error).message || e}`,
      );
      HMSLogger.e(TAG, err);
      this.failure(name, err);
      throw err;
    }
    if (time) {
      this.initTime[name] = time;
    }
  }

  private async timeInMs<T>(fn: () => Promise<T>): Promise<number> {
    const start = Date.now();
    await fn();
    return Math.floor(Date.now() - start);
  }

  private clean(name: string) {
    delete this.addedTimestamps[name];
    delete this.initTime[name];
    delete this.pluginAdded[name];
  }
}
