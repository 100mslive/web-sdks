import AnalyticsEvent from '../analytics/AnalyticsEvent';

class PluginUsageTracker {
  private pluginUsage: Map<string, number> = new Map<string, number>();
  private pluginLastAddedAt: Map<string, number> = new Map<string, number>();

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
    return this.pluginUsage.get(name);
  };

  updatePluginUsage = (event: AnalyticsEvent) => {
    if (event.name === 'mediaPlugin.added') {
      const name = event.properties.plugin_name;
      const addedAt = event.properties.added_at;
      this.pluginLastAddedAt.set(name, addedAt);
    } else if (event.name === 'mediaPlugin.stats') {
      const name = event.properties.plugin_name;
      const duration = event.properties.duration;
      this.pluginUsage.set(name, (this.pluginUsage.get(name) || 0) + duration * 1000);
      this.pluginLastAddedAt.delete(name);
    }
  };

  cleanup = () => {
    this.pluginUsage.clear();
    this.pluginLastAddedAt.clear();
  };
}

export const pluginUsageTracker = new PluginUsageTracker();
