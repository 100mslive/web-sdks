import { AudioPluginsAnalytics } from './AudioPluginsAnalytics';
import { HMSAudioPlugin, HMSPluginUnsupportedTypes } from './HMSAudioPlugin'; //HMSAudioPluginType
import AnalyticsEventFactory from '../../analytics/AnalyticsEventFactory';
import { ErrorFactory } from '../../error/ErrorFactory';
import { HMSAction } from '../../error/HMSAction';
import { EventBus } from '../../events/EventBus';
import { HMSAudioContextHandler } from '../../internal';
import { HMSLocalAudioTrack } from '../../media/tracks';
import Room from '../../sdk/models/HMSRoom';
import HMSLogger from '../../utils/logger';

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
  private readonly TAG = '[AudioPluginsManager]';
  private readonly hmsTrack: HMSLocalAudioTrack;
  // Map maintains the insertion order
  readonly pluginsMap: Map<string, HMSAudioPlugin>;
  private audioContext?: AudioContext;

  private sourceNode?: MediaStreamAudioSourceNode;
  private destinationNode?: MediaStreamAudioDestinationNode;
  private prevAudioNode?: any;
  private analytics: AudioPluginsAnalytics;
  // This will replace the native track in peer connection when plugins are enabled
  private outputTrack?: MediaStreamTrack;
  private pluginAddInProgress = false;
  private room?: Room;

  constructor(track: HMSLocalAudioTrack, private eventBus: EventBus, room?: Room) {
    this.hmsTrack = track;
    this.pluginsMap = new Map();
    this.analytics = new AudioPluginsAnalytics(eventBus);
    this.audioContext = HMSAudioContextHandler.getAudioContext();
    this.room = room;
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
      this.analytics.added(name, this.audioContext!.sampleRate);
      this.analytics.failure(name, err);
      HMSLogger.w("can't add another plugin when previous add is in progress");
      throw err;
    }

    switch (plugin.getName()) {
      case 'HMSKrispPlugin': {
        if (!this.room?.isNoiseCancellationEnabled) {
          const errorMessage = 'Krisp Noise Cancellation is not enabled for this room';
          if (this.pluginsMap.size === 0) {
            throw Error(errorMessage);
          } else {
            HMSLogger.w(this.TAG, errorMessage);
            return;
          }
        }
        this.eventBus.analytics.publish(AnalyticsEventFactory.krispStart());
        break;
      }

      default:
    }
    this.pluginAddInProgress = true;

    try {
      await this.addPluginInternal(plugin);
    } finally {
      this.pluginAddInProgress = false;
    }
  }

  // eslint-disable-next-line complexity
  private async addPluginInternal(plugin: HMSAudioPlugin) {
    const name = plugin.getName?.();
    if (this.pluginsMap.get(name)) {
      HMSLogger.w(this.TAG, `plugin - ${name} already added.`);
      return;
    }

    await this.validateAndThrow(name, plugin);
    // @ts-ignore
    plugin.setEventBus?.(this.eventBus);

    try {
      if (this.pluginsMap.size === 0) {
        await this.initAudioNodes();
      } else if (this.prevAudioNode) {
        // Previous node will be connected to destination. Disconnect that
        this.prevAudioNode.disconnect();
      }
      this.analytics.added(name, this.audioContext!.sampleRate);
      await this.analytics.initWithTime(name, async () => plugin.init());
      this.pluginsMap.set(name, plugin);
      await this.processPlugin(plugin);
      await this.connectToDestination();
      await this.updateProcessedTrack();
    } catch (err) {
      HMSLogger.e(this.TAG, 'failed to add plugin', err);
      throw err;
    }
  }

  validatePlugin(plugin: HMSAudioPlugin) {
    return plugin.checkSupport(this.audioContext);
  }

  async validateAndThrow(name: string, plugin: HMSAudioPlugin) {
    const result = this.validatePlugin(plugin);
    if (result.isSupported) {
      HMSLogger.i(this.TAG, `plugin is supported,- ${plugin.getName()}`);
    } else {
      //Needed to re-add in the reprocess case, to send error message in case of failure
      this.analytics.added(name, this.audioContext!.sampleRate);
      if (result.errType === HMSPluginUnsupportedTypes.PLATFORM_NOT_SUPPORTED) {
        const err = ErrorFactory.MediaPluginErrors.PlatformNotSupported(
          HMSAction.AUDIO_PLUGINS,
          'platform not supported, see docs',
        );
        this.analytics.failure(name, err);
        await this.cleanup();
        throw err;
      } else if (result.errType === HMSPluginUnsupportedTypes.DEVICE_NOT_SUPPORTED) {
        const err = ErrorFactory.MediaPluginErrors.DeviceNotSupported(
          HMSAction.AUDIO_PLUGINS,
          'audio device not supported, see docs',
        );
        this.analytics.failure(name, err);
        await this.cleanup();
        throw err;
      }
    }
  }

  async removePlugin(plugin: HMSAudioPlugin) {
    switch (plugin.getName()) {
      case 'HMSKrispPlugin': {
        this.eventBus.analytics.publish(AnalyticsEventFactory.krispStop());
        break;
      }
      default:
        break;
    }
    await this.removePluginInternal(plugin);
    if (this.pluginsMap.size === 0) {
      // remove all previous nodes
      await this.cleanup();
      HMSLogger.i(this.TAG, `No plugins left, stopping plugins loop`);
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
    //disconnect nodes, stop track
    this.sourceNode?.disconnect();
    this.prevAudioNode?.disconnect();
    this.outputTrack?.stop();

    // reset all variables
    this.sourceNode = undefined;
    this.destinationNode = undefined;
    this.prevAudioNode = undefined;
    this.outputTrack = undefined;
  }

  //Keeping it separate since we are initializing context only once
  async closeContext() {
    this.audioContext = undefined;
  }

  async reprocessPlugins() {
    if (this.pluginsMap.size === 0 || !this.sourceNode) {
      return;
    }
    const plugins = Array.from(this.pluginsMap.values()); // make a copy of plugins
    await this.cleanup();
    await this.initAudioNodes();
    for (const plugin of plugins) {
      await this.addPlugin(plugin);
    }
    await this.updateProcessedTrack();
  }

  private async initAudioNodes() {
    if (this.audioContext) {
      // recreate this again, irrespective of it being already there so that the latest native track is used in source node
      const audioStream = new MediaStream([this.hmsTrack.nativeTrack]);
      this.sourceNode = this.audioContext.createMediaStreamSource(audioStream);
      if (!this.destinationNode) {
        this.destinationNode = this.audioContext.createMediaStreamDestination();
        this.outputTrack = this.destinationNode.stream.getAudioTracks()[0];
      }
    }
  }

  private async updateProcessedTrack() {
    try {
      await this.hmsTrack.setProcessedTrack(this.outputTrack);
    } catch (err) {
      HMSLogger.e(this.TAG, 'error in setting processed track', err);
      throw err;
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
      HMSLogger.e(this.TAG, `error in processing plugin ${name}`, err);
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
      HMSLogger.e(this.TAG, 'error in connecting to destination node', err);
    }
  }

  private async removePluginInternal(plugin: HMSAudioPlugin) {
    const name = plugin.getName?.();
    if (!this.pluginsMap.get(name)) {
      HMSLogger.w(this.TAG, `plugin - ${name} not found to remove.`);
      return;
    }
    HMSLogger.i(this.TAG, `removing plugin ${name}`);
    this.pluginsMap.delete(name);
    plugin.stop();
    this.analytics.removed(name);
  }
}
