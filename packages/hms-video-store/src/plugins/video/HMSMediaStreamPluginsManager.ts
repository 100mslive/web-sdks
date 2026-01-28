import { HMSMediaStreamPlugin } from './HMSMediaStreamPlugin';
import { VideoPluginsAnalytics } from './VideoPluginsAnalytics';
import { EventBus } from '../../events/EventBus';
import { HMSException } from '../../internal';
import Room from '../../sdk/models/HMSRoom';
import HMSLogger from '../../utils/logger';

export class HMSMediaStreamPluginsManager {
  private readonly TAG = '[MediaStreamPluginsManager]';
  private analytics: VideoPluginsAnalytics;
  readonly plugins: Set<HMSMediaStreamPlugin>;
  private room?: Room;

  constructor(eventBus: EventBus, room?: Room) {
    this.plugins = new Set<HMSMediaStreamPlugin>();
    this.analytics = new VideoPluginsAnalytics(eventBus);
    this.room = room;
  }

  addPlugins(plugins: HMSMediaStreamPlugin[]): void {
    plugins.forEach(plugin => {
      switch (plugin.getName()) {
        case 'HMSEffectsPlugin':
          if (!this.room?.isEffectsEnabled) {
            const errorMessage = 'Effects Virtual Background is not enabled for this room';
            if (this.plugins.size === 0) {
              throw Error(errorMessage);
            } else {
              HMSLogger.w(this.TAG, errorMessage);
              return;
            }
          }
          break;
        default:
      }
      this.plugins.add(plugin);
    });
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

  async cleanup() {
    this.removePlugins(Array.from(this.plugins));
  }
}
