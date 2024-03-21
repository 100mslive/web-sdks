import AnalyticsEvent from '../analytics/AnalyticsEvent';
import { EventBus } from '../events/EventBus';

export class PluginUsageTracker {
  private pluginUsage: Map<string, number> = new Map<string, number>();
  private pluginLastAddedAt: Map<string, number> = new Map<string, number>();

  constructor(private eventBus: EventBus) {
    this.eventBus.analytics.subscribe(e => this.updatePluginUsageData(e));
  }

  getPluginUsage = (name: string) => {
    if (!this.pluginUsage.has(name)) {
      this.pluginUsage.set(name, 0);
    }
    if (this.pluginLastAddedAt.has(name)) {
      const lastAddedAt = this.pluginLastAddedAt.get(name) || 0;
      const extraDuration = lastAddedAt ? Date.now() - lastAddedAt : 0;
      this.pluginUsage.set(name, (this.pluginUsage.get(name) || 0) + extraDuration);
      this.pluginLastAddedAt.delete(name);
    }
    const finalValue = this.pluginUsage.get(name);
    return finalValue;
  };

  // eslint-disable-next-line complexity
  updatePluginUsageData = (event: AnalyticsEvent) => {
    const name = event.properties?.plugin_name || '';
    switch (event.name) {
      case 'mediaPlugin.toggled.on':
      case 'mediaPlugin.added': {
        const addedAt = event.properties.added_at || Date.now();
        this.pluginLastAddedAt.set(name, addedAt);
        break;
      }
      case 'mediaPlugin.toggled.off':
      case 'mediaPlugin.stats': {
        if (this.pluginLastAddedAt.has(name)) {
          const duration = event.properties.duration || (Date.now() - (this.pluginLastAddedAt.get(name) || 0)) / 1000;
          this.pluginUsage.set(name, (this.pluginUsage.get(name) || 0) + Math.max(duration, 0) * 1000);
          this.pluginLastAddedAt.delete(name);
        }
        break;
      }
      default:
    }
  };

  cleanup = () => {
    this.pluginLastAddedAt.clear();
    this.pluginUsage.clear();
  };
}
