import MediaPluginsAnalyticsFactory from '../../analytics/MediaPluginsAnalyticsFactory';
import analyticsEventsService from '../../analytics/AnalyticsEventsService';
import HMSLogger from '../../utils/logger';
import { ErrorFactory, HMSAction } from '../../error/ErrorFactory';
import { HMSException } from '../../error/HMSException';

const TAG = 'AudioPluginsAnalytics';

export class AudioPluginsAnalytics {
  private readonly initTime: Record<string, number>;
  private readonly addedTimestamps: Record<string, number>;
  private readonly pluginAdded: Record<string, boolean>;
  private readonly pluginSampleRate: Record<string, number>;

  constructor() {
    this.initTime = {};
    this.addedTimestamps = {};
    this.pluginAdded = {};
    this.pluginSampleRate = {};
  }

  added(name: string, sampleRate: number) {
    this.pluginAdded[name] = true;
    this.addedTimestamps[name] = Date.now();
    this.initTime[name] = 0;
    this.pluginSampleRate[name] = sampleRate;
  }

  removed(name: string) {
    //send stats
    if (this.pluginAdded[name]) {
      const stats = {
        pluginName: name,
        // duration in seconds
        duration: Math.floor((Date.now() - this.addedTimestamps[name]) / 1000),
        loadTime: this.initTime[name],
        sampleRate: this.pluginSampleRate[name],
      };
      //send stats
      analyticsEventsService.queue(MediaPluginsAnalyticsFactory.audioPluginStats(stats)).flush();
      //clean the plugin details
      this.clean(name);
    }
  }

  failure(name: string, error: HMSException) {
    // send failure event
    if (this.pluginAdded[name]) {
      analyticsEventsService
        .queue(MediaPluginsAnalyticsFactory.audioPluginFailure(name, this.pluginSampleRate[name], error))
        .flush();
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
    delete this.pluginSampleRate[name];
  }
}
