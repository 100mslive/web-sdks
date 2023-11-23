import { HMSMediaStreamPlugin } from './HMSMediaStreamPlugin';

export class HMSMediaStreamPluginsManager {
  private plugins = new Set<HMSMediaStreamPlugin>();

  addPlugins(plugins: HMSMediaStreamPlugin[]): void {
    plugins.forEach(plugin => this.plugins.add(plugin));
  }

  removePlugins(plugins: HMSMediaStreamPlugin[]) {
    plugins.forEach(plugin => {
      const deleted = this.plugins.delete(plugin);
      if (deleted) {
        plugin.stop();
      }
    });
  }

  applyPlugins(inputStream: MediaStream): MediaStream {
    let processedStream = inputStream;
    for (const plugin of this.plugins) {
      try {
        console.log('ps', processedStream.getVideoTracks()[0]);
        processedStream = plugin.apply(processedStream);
      } catch (e) {
        console.error('could not apply plugin', e, plugin);
      }
    }
    return processedStream;
  }

  getPlugins(): string[] {
    return Array.from(this.plugins).map(plugin => plugin.getName());
  }
}
