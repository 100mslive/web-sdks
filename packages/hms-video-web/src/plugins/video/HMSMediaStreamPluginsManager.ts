import { HMSMediaStreamPlugin } from './HMSMediaStreamPlugin';

export class HMSMediaStreamPluginsManager {
  private plugins = new Set<HMSMediaStreamPlugin>();

  addPlugins(plugins: HMSMediaStreamPlugin[]): void {
    plugins.forEach(plugin => this.plugins.add(plugin));
  }

  removePlugins(plugins: HMSMediaStreamPlugin[]) {
    plugins.forEach(plugin => this.plugins.delete(plugin));
  }

  applyPlugins(inputStream: MediaStream): MediaStream {
    let processedStream = inputStream;
    for (const plugin of this.plugins) {
      try {
        processedStream = plugin.apply(processedStream);
      } catch (e) {
        console.error('could not apply plugin', plugin);
      }
    }
    return processedStream;
  }
}
