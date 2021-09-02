import { HMSAudioPlugin } from './HMSAudioPlugin'; //HMSAudioPluginType
import { HMSLocalAudioTrack } from '../../media/tracks';
import HMSLogger from '../../utils/logger';
import { ErrorFactory, HMSAction } from '../../error/ErrorFactory';
import { AudioPluginsAnalytics } from './AudioPluginsAnalytics';

const TAG = 'AudioPluginsManager';

export class HMSAudioPluginsManager {
  private readonly hmsTrack: HMSLocalAudioTrack;
  private readonly plugins: string[]; // plugin names in order they were added
  private readonly pluginsMap: Record<string, HMSAudioPlugin>; // plugin names to their instance mapping
  private audioContext?: AudioContext;

  private sourceNode?: MediaStreamAudioSourceNode;
  private destinationNode?: MediaStreamAudioDestinationNode;
  private intermediateNode?: any;
  private analytics: AudioPluginsAnalytics;
  private outputTrack?: MediaStreamTrack;
  private pluginAddInProgress: boolean = false;

  constructor(track: HMSLocalAudioTrack) {
    this.hmsTrack = track;
    this.plugins = [];
    this.pluginsMap = {};
    this.analytics = new AudioPluginsAnalytics();
  }

  getPlugins(): string[] {
    return [...this.plugins];
  }

  async addPlugin(plugin: HMSAudioPlugin) {
    if (this.pluginAddInProgress) {
      const name = plugin.getName?.();
      if (!name || name === '') {
        HMSLogger.w('no name provided by the plugin');
        return;
      }
      let err = ErrorFactory.MediaPluginErrors.AddAlreadyInProgress(
        HMSAction.AUDIO_PLUGINS,
        'Add Plugin is already in Progress',
      );
      this.analytics.failure(name, err);
      HMSLogger.w("can't add another plugin when previous add is in progress");
      return;
    }

    this.pluginAddInProgress = true;

    try {
      await this.addPluginInternal(plugin);
    } catch (err) {
      throw err;
    } finally {
      this.pluginAddInProgress = false;
    }
  }

  private async addPluginInternal(plugin: HMSAudioPlugin) {
    const name = plugin.getName?.();
    if (!name || name === '') {
      HMSLogger.w('no name provided by the plugin');
      return;
    }
    if (this.pluginsMap[name]) {
      HMSLogger.w(TAG, `plugin - ${plugin.getName()} already added.`);
      return;
    }

    if (this.plugins.length > 0) {
      HMSLogger.w(TAG, 'An audio plugin is already added, currently supporting only one plugin at a time');
      //TODO: throw err here to notify UI
      return;
    }

    if (!plugin.isSupported()) {
      let err = ErrorFactory.MediaPluginErrors.PlatformNotSupported(HMSAction.AUDIO_PLUGINS, 'platform not supported ');
      this.analytics.failure(name, err);
      HMSLogger.i(TAG, `Platform is not supported for plugin - ${plugin.getName()}`);
      return;
    }
    try {
      this.analytics.added(name);
      await this.analytics.initWithTime(name, async () => plugin.init());
      this.plugins.push(name);
      this.pluginsMap[name] = plugin;
      await this.startPluginsProcess();
    } catch (err) {
      HMSLogger.e(TAG, 'failed to add plugin', err);
      await this.removePlugin(plugin);
      throw err;
    }
  }

  async removePlugin(plugin: HMSAudioPlugin) {
    const name = plugin.getName();
    if (!this.pluginsMap[name]) {
      HMSLogger.w(TAG, `plugin - ${name} not found to remove.`);
      return;
    }
    HMSLogger.i(TAG, `removing plugin ${name}`);
    this.removePluginEntry(name);
    if (this.plugins.length == 0) {
      HMSLogger.i(TAG, `No plugins left, stopping plugins loop`);
      await this.stopPluginsProcess();
    }
    if (this.intermediateNode) {
      this.intermediateNode.disconnect();
      this.intermediateNode = null;
    }

    plugin.stop();
    this.analytics.removed(name);
  }

  removePluginEntry(name: string) {
    const index = this.plugins.indexOf(name);
    if (index !== -1) {
      this.plugins.splice(index, 1);
    }
    if (this.pluginsMap[name]) {
      delete this.pluginsMap[name];
    }
  }

  async cleanup() {
    for (const name of this.plugins) {
      await this.removePlugin(this.pluginsMap[name]);
    }
    // memory cleanup
    this.outputTrack?.stop();
  }

  private initElementsAndStream() {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }

    if (!this.sourceNode) {
      const audioStream = new MediaStream([this.hmsTrack.nativeTrack]);
      this.sourceNode = this.audioContext.createMediaStreamSource(audioStream);
    }
    if (!this.destinationNode) {
      this.destinationNode = this.audioContext.createMediaStreamDestination();
      this.outputTrack = this.destinationNode.stream.getAudioTracks()[0];
    }
  }

  private async startPluginsProcess() {
    this.initElementsAndStream();
    if (!this.audioContext) {
      HMSLogger.w(TAG, `Audio context is not defined`);
      return;
    }
    try {
      await this.hmsTrack.setProcessedTrack(this.outputTrack);
    } catch (err) {
      HMSLogger.e(TAG, 'error in setting processed track', err);
      throw err;
    }
    try {
      await this.processAudioThroughPlugins();
    } catch (err) {
      HMSLogger.e(TAG, 'error in processing audio plugins', err);
      throw err;
    }
  }

  private async processAudioThroughPlugins() {
    for (const name of this.plugins) {
      const plugin = this.pluginsMap[name];
      if (!plugin) {
        continue;
      }

      try {
        if (this.audioContext) {
          this.intermediateNode = await plugin.processAudioTrack(
            this.audioContext,
            this.intermediateNode || this.sourceNode,
          );
        }
      } catch (err) {
        //TODO error happened on processing of plugin notify UI
        HMSLogger.e(TAG, `error in processing plugin ${name}`, err);
        //remove plugin from loop and stop analytics for it
        await this.removePlugin(plugin);
      }
    }
    if (this.intermediateNode && this.destinationNode) {
      this.intermediateNode.connect(this.destinationNode);
    }
  }

  private async stopPluginsProcess() {
    await this.hmsTrack.setProcessedTrack(undefined);
  }
}
