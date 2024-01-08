import { HMSMediaStreamPlugin } from './HMSMediaStreamPlugin';
import HMSLogger from '../../utils/logger';

export class HMSMediaStreamPluginsManager {
  private plugins = new Set<HMSMediaStreamPlugin>();

  addPlugins(plugins: HMSMediaStreamPlugin[]): void {
    plugins.forEach(plugin => this.plugins.add(plugin));
  }

  removePlugins(plugins: HMSMediaStreamPlugin[]) {
    plugins.forEach(plugin => {
      this.plugins.delete(plugin);
    });
  }

  applyPlugins(inputStream: MediaStream): MediaStream {
    let processedStream = inputStream;
    for (const plugin of this.plugins) {
      try {
        processedStream = plugin.apply(processedStream);
      } catch (e) {
        HMSLogger.e('Could not apply plugin', e, plugin);
      }
    }
    return processedStream;
  }

  getPlugins(): string[] {
    return Array.from(this.plugins).map(plugin => plugin.getName());
  }
}
