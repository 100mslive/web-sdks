import MediaPluginsAnalyticsFactory from '../../analytics/MediaPluginsAnalyticsFactory';
import { ErrorFactory } from '../../error/ErrorFactory';
import { HMSAction } from '../../error/HMSAction';
import { HMSException } from '../../error/HMSException';
import { EventBus } from '../../events/EventBus';
import HMSLogger from '../../utils/logger';
import { RunningAverage } from '../../utils/math';

export class VideoPluginsAnalytics {
  private readonly TAG = '[VideoPluginsAnalytics]';
  private readonly initTime: Record<string, number>;
  private readonly addedTimestamps: Record<string, number>;
  private readonly preProcessingAvgs: RunningAverage;
  private readonly processingAvgs: Record<string, RunningAverage>;
  private readonly pluginAdded: Record<string, boolean>;
  private readonly pluginInputFrameRate: Record<string, number>;
  private readonly pluginFrameRate: Record<string, number>;

  constructor(private eventBus: EventBus) {
    this.initTime = {};
    this.preProcessingAvgs = new RunningAverage();
    this.addedTimestamps = {};
    this.processingAvgs = {};
    this.pluginAdded = {};
    this.pluginInputFrameRate = {};
    this.pluginFrameRate = {};
  }

  added(name: string, inputFrameRate?: number, pluginFrameRate?: number) {
    this.pluginAdded[name] = true;
    this.addedTimestamps[name] = Date.now();
    this.initTime[name] = 0;
    this.processingAvgs[name] = new RunningAverage();
    if (inputFrameRate) {
      this.pluginInputFrameRate[name] = inputFrameRate;
      this.pluginFrameRate[name] = pluginFrameRate || inputFrameRate;
    }
    this.eventBus.analytics.publish(MediaPluginsAnalyticsFactory.added(name, this.addedTimestamps[name]));
  }

  removed(name: string) {
    //send stats
    if (this.pluginAdded[name]) {
      const stats = {
        pluginName: name,
        // duration in seconds
        duration: Math.floor((Date.now() - this.addedTimestamps[name]) / 1000),
        loadTime: this.initTime[name],
        avgPreProcessingTime: this.preProcessingAvgs.getAvg(), //Do we need this in stat not plugin specific
        avgProcessingTime: this.processingAvgs[name]?.getAvg(),
        inputFrameRate: this.pluginInputFrameRate[name],
        pluginFrameRate: this.pluginFrameRate[name],
      };
      //send stats
      this.eventBus.analytics.publish(MediaPluginsAnalyticsFactory.stats(stats));
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
      HMSLogger.i(this.TAG, `Plugin Already loaded ${name}, time it took: ${this.initTime[name]}`);
      return;
    }
    let time: number | undefined = undefined;
    try {
      time = await this.timeInMs(initFn);
      HMSLogger.i(this.TAG, `Time taken for Plugin ${name} initialization : ${time}`);
    } catch (e) {
      //Failed during initialization of plugin(model loading etc...)
      const err = ErrorFactory.MediaPluginErrors.InitFailed(
        HMSAction.VIDEO_PLUGINS,
        `failed during initialization of plugin${(e as Error).message || e}`,
      );
      HMSLogger.e(this.TAG, err);
      this.failure(name, err);
      throw err;
    }
    if (time) {
      this.initTime[name] = time;
    }
  }

  async preProcessWithTime<T>(preProcessFn: () => Promise<T>) {
    //TODO: check if it is required to maintain and shall we handle preprocess failures
    const time = await this.timeInMs(preProcessFn);
    this.preProcessingAvgs.add(time);
  }

  async processWithTime<T>(name: string, processFn: () => Promise<T>) {
    let time: number | undefined = undefined;
    try {
      time = await this.timeInMs(processFn);
    } catch (e) {
      //Failed during processing of plugin
      const err = ErrorFactory.MediaPluginErrors.ProcessingFailed(
        HMSAction.VIDEO_PLUGINS,
        `Failed during processing of plugin${(e as Error).message || e}`,
      );
      HMSLogger.e(this.TAG, err);
      this.failure(name, err);
      throw err;
    }
    if (time) {
      this.processingAvgs[name]?.add(time);
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
    delete this.processingAvgs[name];
    delete this.pluginAdded[name];
    delete this.pluginInputFrameRate[name];
    delete this.pluginFrameRate[name];
  }
}
