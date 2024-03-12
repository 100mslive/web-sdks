import AnalyticsEvent from '../analytics/AnalyticsEvent';

class PluginUsageTracker {
  private pluginUsage: Map<string, number> = new Map<string, number>();
  private pluginLastAddedAt: Map<string, number> = new Map<string, number>();

  getPluginUsage = (name: string, sessionID: string) => {
    const pluginKey = `${sessionID}-${name}`;

    if (!this.pluginUsage.has(pluginKey)) {
      this.pluginUsage.set(pluginKey, 0);
    }
    if (this.pluginLastAddedAt.has(pluginKey)) {
      const lastAddedAt = this.pluginLastAddedAt.get(pluginKey) || 0;
      const extraDuration = lastAddedAt ? Date.now() - lastAddedAt : 0;
      this.pluginUsage.set(pluginKey, (this.pluginUsage.get(pluginKey) || 0) + extraDuration);
      this.pluginLastAddedAt.delete(pluginKey);
    }
    return this.pluginUsage.get(pluginKey);
  };

  updatePluginUsage = (event: AnalyticsEvent, sessionID: string) => {
    const name = event.properties.plugin_name;
    const pluginKey = `${sessionID}-${name}`;

    if (event.name === 'mediaPlugin.added') {
      const addedAt = event.properties.added_at;
      this.pluginLastAddedAt.set(pluginKey, addedAt);
    } else if (event.name === 'mediaPlugin.stats') {
      const duration = event.properties.duration;
      this.pluginUsage.set(pluginKey, (this.pluginUsage.get(pluginKey) || 0) + duration * 1000);
      this.pluginLastAddedAt.delete(pluginKey);
    }
  };

  cleanup = (sessionID: string) => {
    for (const key of this.pluginUsage.keys()) {
      if (sessionID.length && key.includes(sessionID)) {
        this.pluginUsage.delete(key);
        this.pluginLastAddedAt.delete(key);
      }
    }
  };
}

export const pluginUsageTracker = new PluginUsageTracker();
