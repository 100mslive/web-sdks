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
  /**
   * add, remove and reprocess all rebuild the node graph and stop/start the plugins, so they must
   * not interleave: a reprocess (mic track replaced) landing while an add is still creating its
   * filter node stops the plugin under that add, and the add then publishes a dead node. Those
   * three are the only entry points that take this queue, and rebuildGraph - the one thing that
   * touches the graph - only ever runs inside a task, so there is no queueing to duplicate.
   */
  private queue: Promise<unknown> = Promise.resolve();
  /**
   * cleanup must not queue: track teardown awaits it before stopping tracks and removing listeners,
   * and a plugin init that never settles would wedge it forever. It tears down immediately, and a
   * rebuild still in flight unwinds against this flag instead of publishing onto the dead graph.
   */
  private disposed = false;

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

    if (name === 'HMSKrispPlugin' && this.room?.isNoiseCancellationEnabled) {
      // app enables only, a rebuild re-adding the plugin is not a new start
      this.eventBus.analytics.publish(AnalyticsEventFactory.krispStart());
    }

    await this.serialize(async () => {
      // set inside the task: the flag is the app facing "an add is running" guard, it must not also
      // cover the time this task spends queued behind a reprocess, or an unrelated add gets 7004
      this.pluginAddInProgress = true;
      try {
        if (this.pluginsMap.has(name)) {
          HMSLogger.w(this.TAG, `plugin - ${name} already added.`);
          return;
        }
        // @ts-ignore
        plugin.setEventBus?.(this.eventBus);
        await this.rebuildGraph(plugin);
      } finally {
        this.pluginAddInProgress = false;
      }
    });
  }

  validatePlugin(plugin: HMSAudioPlugin) {
    return plugin.checkSupport(this.audioContext);
  }

  async removePlugin(plugin: HMSAudioPlugin) {
    const name = plugin.getName?.();
    if (name === 'HMSKrispPlugin') {
      this.eventBus.analytics.publish(AnalyticsEventFactory.krispStop());
    }

    await this.serialize(async () => {
      if (!this.pluginsMap.has(name)) {
        HMSLogger.w(this.TAG, `plugin - ${name} not found to remove.`);
        return;
      }
      plugin.stop();
      this.unregister(name);
      // the graph is rebuilt from what is left: there is no way to splice one plugin's nodes out
      await this.rebuildGraph();
    });
  }

  /**
   * Deliberately not queued, see the disposed field. Track teardown awaits this before it stops the
   * tracks and drops its listeners, so it can only be bounded by our own work, never by a plugin's.
   */
  async cleanup() {
    this.disposed = true;
    for (const [name, plugin] of Array.from(this.pluginsMap)) {
      plugin.stop();
      this.unregister(name);
    }
    // Startup opens usage before registration and may still be pending at teardown.
    this.analytics.cleanup();
    this.disconnectNodes();
    await this.updateProcessedTrack(undefined);
  }

  //Keeping it separate since we are initializing context only once
  async closeContext() {
    this.audioContext = undefined;
  }

  async reprocessPlugins() {
    await this.serialize(() => this.rebuildGraph());
  }

  private serialize<T>(task: () => Promise<T>): Promise<T> {
    const run = this.queue.then(task);
    this.queue = run.catch(err => {
      // Keep the queue usable after a failed task; callers still receive the rejection through run.
      HMSLogger.w(this.TAG, 'queued plugin task failed', err);
    });
    return run;
  }

  /**
   * The graph is a function of pluginsMap: stop whatever is wired up now, then build
   * source -> plugin1 -> .. -> destination from the current list against the current native track.
   * add, remove and reprocess all just mutate the map and call this, so one code path builds the
   * graph and there is no second incremental one to keep in sync with it.
   *
   * A plugin that cannot be started is dropped and the rest of the graph is still built, so one
   * plugin's failure does not silently cost the others theirs. The first failure is thrown once the
   * graph is up, which is what turns into audioPluginFailed for the app.
   *
   * @param added a plugin to append to the chain. It has not started yet, so unlike the registered
   * ones it must not be stopped first, and it is only registered once it is running.
   */
  private async rebuildGraph(added?: HMSAudioPlugin) {
    await this.stopGraph();
    if (this.disposed) {
      return;
    }

    const plugins = Array.from(this.pluginsMap.values());
    if (added) {
      plugins.push(added);
    }

    let failure: Error | undefined;
    if (plugins.length > 0) {
      this.initAudioNodes();
      failure = await this.startPlugins(plugins);
      if (this.disposed) {
        // startPlugins unwound what it had started, a cleanup published the native track already
        return;
      }
    }

    await this.publishGraph();

    if (failure) {
      throw failure;
    }
  }

  private async stopGraph() {
    if (this.outputTrack) {
      // Keep native audio publishing while the replacement graph initializes.
      await this.updateProcessedTrack(undefined);
    }
    // a plugin cannot be re-inited while it is still running
    for (const [name, plugin] of this.pluginsMap) {
      plugin.stop();
      // Record this usage interval before restarting the plugin resets its timestamp.
      this.analytics.removed(name);
    }
    this.disconnectNodes();
  }

  /** publishes the rebuilt graph, or goes back to the native track if nothing is left in it */
  private async publishGraph() {
    if (this.pluginsMap.size === 0) {
      HMSLogger.i(this.TAG, 'no plugins left in the graph, going back to the native track');
      this.disconnectNodes();
      await this.updateProcessedTrack(undefined);
      return;
    }
    this.connectToDestination();
    await this.updateProcessedTrack(this.outputTrack);
  }

  /**
   * Starts and chains every plugin in order, dropping the ones that fail. Returns the first failure
   * so the caller can report it after the graph is up.
   */
  private async startPlugins(plugins: HMSAudioPlugin[]) {
    let failure: Error | undefined;
    for (const plugin of plugins) {
      const name = plugin.getName?.();
      try {
        await this.startPlugin(plugin);
      } catch (err) {
        HMSLogger.e(this.TAG, `failed to start plugin ${name}, dropping it`, err);
        this.unregister(name);
        failure = failure || (err as Error);
        continue;
      }
      if (this.disposed) {
        /**
         * A teardown landed inside this plugin's own code. cleanup stops what is registered, and
         * this plugin finished starting after it ran, so it is running again and ours to stop.
         */
        HMSLogger.w(this.TAG, `torn down while starting ${name}, dropping the graph`);
        plugin.stop();
        this.unregister(name);
        this.disconnectNodes();
        return failure;
      }
      this.pluginsMap.set(name, plugin);
    }
    return failure;
  }

  /**
   * Everything that has to hold every time a plugin is wired into the graph, on a fresh add and on
   * every rebuild alike: the room policy and the device support are both re-checked, because a
   * template change or a mic switch can turn either of them against a plugin mid-session.
   */
  private async startPlugin(plugin: HMSAudioPlugin) {
    const name = plugin.getName?.();
    if (name === 'HMSKrispPlugin' && !this.room?.isNoiseCancellationEnabled) {
      // ponytail: no MediaPluginErrors code covers a room policy, so this stays untyped for now
      throw Error('Krisp Noise Cancellation is not enabled for this room');
    }
    // re-added on every rebuild so a failure is reported against a live analytics record
    this.analytics.added(name, this.audioContext!.sampleRate);
    this.validateAndThrow(name, plugin);
    try {
      await this.analytics.initWithTime(name, async () => plugin.init());
      if (this.disposed) {
        // do not hand a node to a graph that is being torn down, startPlugins stops the plugin
        return;
      }
      const currentNode = await plugin.processAudioTrack(
        this.audioContext!, // it is always present at this point
        this.prevAudioNode || this.sourceNode,
      );
      // the previous plugin was the end of the chain, extend it with this one
      this.prevAudioNode?.connect(currentNode);
      this.prevAudioNode = currentNode;
    } catch (err) {
      // This startup may own resources even if an earlier instance was already stopped.
      plugin.stop();
      throw err;
    }
  }

  // private: it runs per plugin inside a rebuild, its failure only drops that plugin
  private validateAndThrow(name: string, plugin: HMSAudioPlugin) {
    const result = this.validatePlugin(plugin);
    if (result.isSupported) {
      HMSLogger.i(this.TAG, `plugin is supported,- ${plugin.getName()}`);
      return;
    }
    let err;
    if (result.errType === HMSPluginUnsupportedTypes.PLATFORM_NOT_SUPPORTED) {
      err = ErrorFactory.MediaPluginErrors.PlatformNotSupported(
        HMSAction.AUDIO_PLUGINS,
        'platform not supported, see docs',
      );
    } else if (result.errType === HMSPluginUnsupportedTypes.DEVICE_NOT_SUPPORTED) {
      err = ErrorFactory.MediaPluginErrors.DeviceNotSupported(
        HMSAction.AUDIO_PLUGINS,
        'audio device not supported, see docs',
      );
    }
    if (err) {
      this.analytics.failure(name, err);
      throw err;
    }
  }

  private initAudioNodes() {
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

  private connectToDestination() {
    try {
      if (this.prevAudioNode && this.destinationNode && this.prevAudioNode.context === this.destinationNode.context) {
        this.prevAudioNode.connect(this.destinationNode);
      }
    } catch (err) {
      HMSLogger.e(this.TAG, 'error in connecting to destination node', err);
    }
  }

  private async updateProcessedTrack(track?: MediaStreamTrack) {
    try {
      await this.hmsTrack.setProcessedTrack(track);
    } catch (err) {
      HMSLogger.e(this.TAG, 'error in setting processed track', err);
      throw err;
    }
  }

  /** unregisters a plugin, the caller decides whether it also needs stopping */
  private unregister(name: string) {
    if (this.pluginsMap.delete(name)) {
      HMSLogger.i(this.TAG, `removed plugin ${name}`);
    }
    this.analytics.removed(name);
  }

  private disconnectNodes() {
    this.sourceNode?.disconnect();
    this.prevAudioNode?.disconnect();
    this.outputTrack?.stop();

    this.sourceNode = undefined;
    this.destinationNode = undefined;
    this.prevAudioNode = undefined;
    this.outputTrack = undefined;
  }
}
