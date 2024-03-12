import AnalyticsEvent from '../analytics/AnalyticsEvent';

class PluginUsageTracker {
  private pluginUsage: Map<string, number> = new Map<string, number>();
  private pluginLastAddedAt: Map<string, number> = new Map<string, number>();

  getPluginUsage = (name: string, sessionID: string) => {
    if (!this.pluginUsage.has(`${sessionID}-${name}`)) {
      this.pluginUsage.set(`${sessionID}-${name}`, 0);
    }
    if (this.pluginLastAddedAt.has(`${sessionID}-${name}`)) {
      const lastAddedAt = this.pluginLastAddedAt.get(`${sessionID}-${name}`) || 0;
      const extraDuration = lastAddedAt ? Date.now() - lastAddedAt : 0;
      this.pluginUsage.set(`${sessionID}-${name}`, (this.pluginUsage.get(`${sessionID}-${name}`) || 0) + extraDuration);
      this.pluginLastAddedAt.delete(`${sessionID}-${name}`);
    }
    return this.pluginUsage.get(`${sessionID}-${name}`);
  };

  updatePluginUsage = (event: AnalyticsEvent, sessionID: string) => {
    if (event.name === 'mediaPlugin.added') {
      const name = event.properties.plugin_name;
      const addedAt = event.properties.added_at;
      this.pluginLastAddedAt.set(`${sessionID}-${name}`, addedAt);
    } else if (event.name === 'mediaPlugin.stats') {
      const name = event.properties.plugin_name;
      const duration = event.properties.duration;
      this.pluginUsage.set(
        `${sessionID}-${name}`,
        (this.pluginUsage.get(`${sessionID}-${name}`) || 0) + duration * 1000,
      );
      this.pluginLastAddedAt.delete(`${sessionID}-${name}`);
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
