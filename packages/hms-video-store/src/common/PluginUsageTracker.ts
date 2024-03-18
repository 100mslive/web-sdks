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

  // eslint-disable-next-line complexity
  updatePluginUsageData = (event: AnalyticsEvent, sessionID: string) => {
    const name = event.properties?.plugin_name || '';
    const pluginKey = `${sessionID}-${name}`;
    switch (event.name) {
      // Sent on leave, after krisp usage is sent
      case 'transport.leave': {
        this.cleanup(sessionID);
        return;
      }
      case 'mediaPlugin.toggled.on':
      case 'mediaPlugin.added': {
        const addedAt = event.properties.added_at || Date.now();
        this.pluginLastAddedAt.set(pluginKey, addedAt);
        break;
      }
      case 'mediaPlugin.toggled.off':
      case 'mediaPlugin.stats': {
        if (this.pluginLastAddedAt.has(pluginKey)) {
          const duration = event.properties.duration
            ? event.properties.duration
            : (Date.now() - (this.pluginLastAddedAt.get(pluginKey) || 0)) / 1000;
          this.pluginUsage.set(pluginKey, (this.pluginUsage.get(pluginKey) || 0) + Math.max(duration, 0) * 1000);
          this.pluginLastAddedAt.delete(pluginKey);
        }
      }
    }
    return;
  };

  private cleanup = (sessionID: string) => {
    for (const key of this.pluginUsage.keys()) {
      if (sessionID.length && key.includes(sessionID)) {
        this.pluginUsage.delete(key);
        this.pluginLastAddedAt.delete(key);
      }
    }
  };
}

export const pluginUsageTracker = new PluginUsageTracker();
