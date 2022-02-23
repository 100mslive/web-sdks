import { HMSAudioPlugin } from './HMSAudioPlugin'; //HMSAudioPluginType
import { HMSLocalAudioTrack } from '../../media/tracks';
import HMSLogger from '../../utils/logger';
import { ErrorFactory, HMSAction } from '../../error/ErrorFactory';
import { AudioPluginsAnalytics } from './AudioPluginsAnalytics';

const TAG = 'AudioPluginsManager';

/**
 * This class manages applying different plugins on a local audio track. Plugins which need to modify the audio
 * are called in the order they were added. Plugins which do not need to modify the audio are called
 * with the original input.
 *
 * Concepts -
 * Audio Plugin - A module which can take in input audio, do some processing on it and return an AudioNode
 *
 * For Each Plugin, an AudioNode will be created and the source will be created from local audio track.
 * Each Audio node will be connected in the following order
 * source -> first plugin -> second plugin -> third plugin .. so on
 * @see HMSAudioPlugin
 */
export class HMSAudioPluginsManager {
  private readonly hmsTrack: HMSLocalAudioTrack;
  // Map maintains the insertion order
  private readonly pluginsMap: Map<string, HMSAudioPlugin>;
  private audioContext?: AudioContext;

  private sourceNode?: MediaStreamAudioSourceNode;
  private destinationNode?: MediaStreamAudioDestinationNode;
  private prevAudioNode?: any;
  private analytics: AudioPluginsAnalytics;
  // This will replace the native track in peer connection when plugins are enabled
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
    const name = plugin.getName?.();
    if (!name) {
      HMSLogger.w('no name provided by the plugin');
      return;
    }
    if (this.pluginAddInProgress) {
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
    } finally {
      this.pluginAddInProgress = false;
    }
  }

  private async addPluginInternal(plugin: HMSAudioPlugin) {
    const name = plugin.getName?.();
    if (this.pluginsMap.get(name)) {
      HMSLogger.w(TAG, `plugin - ${name} already added.`);
      return;
    }

    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }

    if (!plugin.isSupported(this.audioContext!.sampleRate)) {
      const err = ErrorFactory.MediaPluginErrors.PlatformNotSupported(
        HMSAction.AUDIO_PLUGINS,
        'platform/SampleRate not supported, see docs',
      );
      this.analytics.failure(name, err);
      HMSLogger.i(TAG, `Platform or sampleRate is not supported for plugin, see docs - ${plugin.getName()}`);
      throw err;
    }
    try {
      if (this.pluginsMap.size === 0) {
        await this.initContextAndAudioNodes();
      } else if (this.prevAudioNode) {
        // Previous node will be connected to destination. Disconnect that
        this.prevAudioNode.disconnect();
      }
      this.analytics.added(name);
      await this.analytics.initWithTime(name, async () => plugin.init());
      this.pluginsMap.set(name, plugin);
      await this.processPlugin(plugin);
      await this.connectToDestination();
    } catch (err) {
      HMSLogger.e(TAG, 'failed to add plugin', err);
      throw err;
    }
  }

  async removePlugin(plugin: HMSAudioPlugin) {
    await this.removePluginInternal(plugin);
    if (this.pluginsMap.size === 0) {
      // remove all previous nodes
      await this.cleanup();
      HMSLogger.i(TAG, `No plugins left, stopping plugins loop`);
      await this.hmsTrack.setProcessedTrack(undefined);
    } else {
      // Reprocess the remaining plugins again because there is no way to connect
      // the source of the removed plugin to destination of removed plugin
      await this.reprocessPlugins();
    }
  }

  async cleanup() {
    for (const plugin of this.pluginsMap.values()) {
      await this.removePluginInternal(plugin);
    }
    await this.hmsTrack.setProcessedTrack(undefined);
    // close context, disconnect nodes, stop track
    this.audioContext?.close();
    this.sourceNode?.disconnect();
    this.prevAudioNode?.disconnect();
    this.outputTrack?.stop();

    // reset all variables
    this.sourceNode = undefined;
    this.destinationNode = undefined;
    this.audioContext = undefined;
    this.prevAudioNode = undefined;
    this.outputTrack = undefined;
  }

  async reprocessPlugins() {
    if (this.pluginsMap.size === 0 || !this.sourceNode) {
      return;
    }
    const plugins = Array.from(this.pluginsMap.values()); // make a copy of plugins
    await this.cleanup();
    await this.initContextAndAudioNodes();
    for (const plugin of plugins) {
      await this.addPlugin(plugin);
    }
  }

  private async initContextAndAudioNodes() {
    if (!this.sourceNode) {
      const audioStream = new MediaStream([this.hmsTrack.nativeTrack]);
      this.sourceNode = this.audioContext!.createMediaStreamSource(audioStream);
    }
    if (!this.destinationNode) {
      this.destinationNode = this.audioContext!.createMediaStreamDestination();
      this.outputTrack = this.destinationNode.stream.getAudioTracks()[0];
      try {
        await this.hmsTrack.setProcessedTrack(this.outputTrack);
      } catch (err) {
        HMSLogger.e(TAG, 'error in setting processed track', err);
        throw err;
      }
    }
  }

  private async processPlugin(plugin: HMSAudioPlugin) {
    try {
      const currentNode = await plugin.processAudioTrack(
        this.audioContext!, // it is always present at this point
        this.prevAudioNode || this.sourceNode,
      );
      if (this.prevAudioNode) {
        // if previous node was present while adding this plugin
        // it is disconnected from destination, connect the previous node to
        // to the current node
        this.prevAudioNode.connect(currentNode);
      }
      this.prevAudioNode = currentNode;
    } catch (err) {
      const name = plugin.getName();
      //TODO error happened on processing of plugin notify UI
      HMSLogger.e(TAG, `error in processing plugin ${name}`, err);
      //remove plugin from loop and stop analytics for it
      await this.removePluginInternal(plugin);
    }
  }

  private async connectToDestination() {
    try {
      if (this.prevAudioNode && this.destinationNode && this.prevAudioNode.context === this.destinationNode.context) {
        this.prevAudioNode.connect(this.destinationNode);
      }
    } catch (err) {
      HMSLogger.e(TAG, 'error in connecting to destination node', err);
    }
  }

  private async removePluginInternal(plugin: HMSAudioPlugin) {
    const name = plugin.getName?.();
    if (!this.pluginsMap.get(name)) {
      HMSLogger.w(TAG, `plugin - ${name} not found to remove.`);
      return;
    }
    HMSLogger.i(TAG, `removing plugin ${name}`);
    this.pluginsMap.delete(name);
    plugin.stop();
    this.analytics.removed(name);
  }
}
