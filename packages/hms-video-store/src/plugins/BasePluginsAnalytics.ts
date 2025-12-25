import MediaPluginsAnalyticsFactory from '../analytics/MediaPluginsAnalyticsFactory';
import { ErrorFactory } from '../error/ErrorFactory';
import { HMSAction } from '../error/HMSAction';
import { HMSException } from '../error/HMSException';
import { EventBus } from '../events/EventBus';
import HMSLogger from '../utils/logger';

export abstract class BasePluginsAnalytics {
  protected readonly TAG: string;
  protected readonly initTime: Record<string, number>;
  protected readonly addedTimestamps: Record<string, number>;
  protected readonly pluginAdded: Record<string, boolean>;

  constructor(protected eventBus: EventBus, tagName: string) {
    this.TAG = `[${tagName}]`;
    this.initTime = {};
    this.addedTimestamps = {};
    this.pluginAdded = {};
  }

  protected baseAdded(name: string) {
    this.pluginAdded[name] = true;
    this.addedTimestamps[name] = Date.now();
    this.initTime[name] = 0;
    this.eventBus.analytics.publish(MediaPluginsAnalyticsFactory.added(name, this.addedTimestamps[name]));
  }

  abstract removed(name: string): void;

  abstract failure(name: string, error: HMSException): void;

  async initWithTime<T>(name: string, initFn: () => Promise<T>, action: HMSAction) {
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
        action,
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

  async timeInMs<T>(fn: () => Promise<T>): Promise<number> {
    const start = Date.now();
    await fn();
    return Math.floor(Date.now() - start);
  }

  protected baseClean(name: string) {
    delete this.addedTimestamps[name];
    delete this.initTime[name];
    delete this.pluginAdded[name];
  }

  protected getPluginDuration(name: string): number {
    return Math.floor((Date.now() - this.addedTimestamps[name]) / 1000);
  }

  protected isPluginAdded(name: string): boolean {
    return this.pluginAdded[name];
  }

  protected getPluginLoadTime(name: string): number {
    return this.initTime[name];
  }
}
