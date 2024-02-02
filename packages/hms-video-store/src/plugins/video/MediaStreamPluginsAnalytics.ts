import MediaPluginsAnalyticsFactory from '../../analytics/MediaPluginsAnalyticsFactory';
import { HMSException } from '../../error/HMSException';
import { EventBus } from '../../events/EventBus';

export class MediaStreamPluginsAnalytics {
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
        avgPreProcessingTime: -1,
        avgProcessingTime: -1,
        inputFrameRate: -1,
        pluginFrameRate: -1,
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

  private clean(name: string) {
    delete this.addedTimestamps[name];
    delete this.initTime[name];
    delete this.pluginAdded[name];
  }
}
