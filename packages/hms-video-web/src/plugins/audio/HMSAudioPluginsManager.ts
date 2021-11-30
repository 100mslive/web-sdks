import { HMSAudioPlugin } from './HMSAudioPlugin'; //HMSAudioPluginType
import { HMSLocalAudioTrack } from '../../media/tracks';
import HMSLogger from '../../utils/logger';
import { ErrorFactory, HMSAction } from '../../error/ErrorFactory';
import { AudioPluginsAnalytics } from './AudioPluginsAnalytics';

const TAG = 'AudioPluginsManager';

export class HMSAudioPluginsManager {
  private readonly hmsTrack: HMSLocalAudioTrack;
  private readonly pluginsMap: Map<string, HMSAudioPlugin>; // plugin names to their instance mapping
  private audioContext?: AudioContext;

  private sourceNode?: MediaStreamAudioSourceNode;
  private destinationNode?: MediaStreamAudioDestinationNode;
  private intermediateNode?: any;
  private analytics: AudioPluginsAnalytics;
  private outputTrack?: MediaStreamTrack;
  private pluginAddInProgress = false;

  constructor(track: HMSLocalAudioTrack) {
    this.hmsTrack = track;
    this.pluginsMap = new Map();
    this.analytics = new AudioPluginsAnalytics();
  }

  getPlugins(): string[] {
    return Array.from(this.pluginsMap.keys());
  }

  async addPlugin(plugin: HMSAudioPlugin) {
    if (this.pluginAddInProgress) {
      const name = plugin.getName();
      if (!name) {
        HMSLogger.w('no name provided by the plugin');
        return;
      }
      const err = ErrorFactory.MediaPluginErrors.AddAlreadyInProgress(
        HMSAction.AUDIO_PLUGINS,
        'Add Plugin is already in Progress',
      );
      this.analytics.failure(name, err);
      HMSLogger.w("can't add another plugin when previous add is in progress");
      throw err;
    }

    this.pluginAddInProgress = true;

    try {
      await this.addPluginInternal(plugin);
    } catch (err) {
      this.pluginAddInProgress = false;
      throw err;
    }
  }

  private async addPluginInternal(plugin: HMSAudioPlugin) {
    const name = plugin.getName();
    if (!name) {
      HMSLogger.w('no name provided by the plugin');
      return;
    }
    if (this.pluginsMap.get(name)) {
      HMSLogger.w(TAG, `plugin - ${name} already added.`);
      return;
    }

    if (this.pluginsMap.size > 0) {
      HMSLogger.w(TAG, 'An audio plugin is already added, currently supporting only one plugin at a time');
      //TODO: throw err here to notify UI
      return;
    }

    if (!plugin.isSupported()) {
      const err = ErrorFactory.MediaPluginErrors.PlatformNotSupported(
        HMSAction.AUDIO_PLUGINS,
        'platform not supported ',
      );
      this.analytics.failure(name, err);
      HMSLogger.i(TAG, `Platform is not supported for plugin - ${plugin.getName()}`);
      return;
    }
    try {
      this.analytics.added(name);
      await this.analytics.initWithTime(name, async () => plugin.init());
      this.pluginsMap.set(name, plugin);
      await this.startPluginsProcess();
    } catch (err) {
      HMSLogger.e(TAG, 'failed to add plugin', err);
      await this.removePlugin(plugin);
      throw err;
    }
  }

  async removePlugin(plugin: HMSAudioPlugin) {
    const name = plugin.getName();
    if (!this.pluginsMap.get(name)) {
      HMSLogger.w(TAG, `plugin - ${name} not found to remove.`);
      return;
    }
    HMSLogger.i(TAG, `removing plugin ${name}`);
    this.removePluginEntry(name);
    if (this.pluginsMap.size === 0) {
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
    this.pluginsMap.delete(name);
  }

  async cleanup() {
    for (const plugin of this.pluginsMap.values()) {
      await this.removePlugin(plugin);
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
    for (const plugin of this.pluginsMap.values()) {
      if (!plugin) {
        continue;
      }

      await this.processPlugin(plugin);
      await this.connectToDestination(plugin);
    }
  }

  private async processPlugin(plugin: HMSAudioPlugin) {
    const name = plugin.getName();
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

  private async connectToDestination(plugin: HMSAudioPlugin) {
    const name = plugin.getName();
    try {
      if (
        this.intermediateNode &&
        this.destinationNode &&
        this.intermediateNode.context === this.destinationNode.context
      ) {
        this.intermediateNode.connect(this.destinationNode);
      }
    } catch (err) {
      HMSLogger.e(TAG, `error in processing plugin ${name}`, err);
      //remove plugin from loop and stop analytics for it
      await this.removePlugin(plugin);
    }
  }

  private async stopPluginsProcess() {
    await this.hmsTrack.setProcessedTrack(undefined);
  }
}
