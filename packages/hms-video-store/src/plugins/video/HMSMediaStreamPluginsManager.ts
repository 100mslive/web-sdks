import { HMSMediaStreamPlugin } from './HMSMediaStreamPlugin';
import { VideoPluginsAnalytics } from './VideoPluginsAnalytics';
import { EventBus } from '../../events/EventBus';
import { HMSException } from '../../internal';
import HMSLogger from '../../utils/logger';

export class HMSMediaStreamPluginsManager {
  private analytics: VideoPluginsAnalytics;
  private plugins: Set<HMSMediaStreamPlugin>;

  constructor(eventBus: EventBus) {
    this.plugins = new Set<HMSMediaStreamPlugin>();
    this.analytics = new VideoPluginsAnalytics(eventBus);
  }

  addPlugins(plugins: HMSMediaStreamPlugin[]): void {
    plugins.forEach(plugin => this.plugins.add(plugin));
  }

  removePlugins(plugins: HMSMediaStreamPlugin[]) {
    plugins.forEach(plugin => {
      plugin.stop();
      this.analytics.removed(plugin.getName());
      this.plugins.delete(plugin);
    });
  }

  applyPlugins(inputStream: MediaStream): MediaStream {
    let processedStream = inputStream;
    for (const plugin of this.plugins) {
      const pluginName = plugin.getName();
      try {
        processedStream = plugin.apply(processedStream);
        this.analytics.added(pluginName);
      } catch (e) {
        this.analytics.failure(pluginName, e as HMSException);
        HMSLogger.e('Could not apply plugin', e, pluginName);
      }
    }
    return processedStream;
  }

  getPlugins(): string[] {
    return Array.from(this.plugins).map(plugin => plugin.getName());
  }
}
