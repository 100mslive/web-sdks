import { AudioPluginsAnalytics } from './AudioPluginsAnalytics';
import { HMSAudioPlugin, HMSPluginUnsupportedTypes } from './HMSAudioPlugin'; //HMSAudioPluginType
import AnalyticsEventFactory from '../../analytics/AnalyticsEventFactory';
import { ErrorFactory } from '../../error/ErrorFactory';
import { HMSAction } from '../../error/HMSAction';
import { HMSException } from '../../error/HMSException';
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
   * three are the only entry points that take this queue, and rebuildGraph - the only thing that
   * builds the graph - only ever runs inside one of their tasks, so there is no queueing to
   * duplicate. cleanup is the one exception, it tears the graph down unqueued, see disposed.
   */
  private queue: Promise<unknown> = Promise.resolve();
  /**
   * cleanup must not queue: track teardown awaits it before it destroys the audio level monitor and
   * removes its listeners, and a plugin init that never settles would wedge it forever. It tears
   * down immediately, and a rebuild still in flight unwinds against this flag instead of publishing
   * onto the dead graph.
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
      // no analytics: the record for this name belongs to the add that is actually running, and
      // reporting a failure against it would end that plugin's usage and lose its stats
      HMSLogger.w("can't add another plugin when previous add is in progress");
      throw err;
    }

    await this.serialize(async () => {
      // set inside the task: the flag is the app facing "an add is running" guard, it must not also
      // cover the time this task spends queued behind a reprocess, or an unrelated add gets 7004
      this.pluginAddInProgress = true;
      try {
        this.throwIfDisposedForAdd(plugin);
        if (this.pluginsMap.has(name)) {
          HMSLogger.w(this.TAG, `plugin - ${name} already added.`);
          return;
        }
        if (name === 'HMSKrispPlugin' && this.room?.isNoiseCancellationEnabled) {
          // one per app enable: neither a rebuild re-adding the plugin nor an add of a plugin that
          // is already running is a new start, and krisp.stop is only published for a real removal
          this.eventBus.analytics.publish(AnalyticsEventFactory.krispStart());
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

    await this.serialize(async () => {
      if (!this.pluginsMap.has(name)) {
        HMSLogger.w(this.TAG, `plugin - ${name} not found to remove.`);
        return;
      }
      if (name === 'HMSKrispPlugin') {
        this.eventBus.analytics.publish(AnalyticsEventFactory.krispStop());
      }
      this.stopPlugin(name, plugin, 'on remove');
      this.unregister(name);
      // the graph is rebuilt from what is left: there is no way to splice one plugin's nodes out
      await this.rebuildGraph();
    });
  }

  /**
   * Deliberately not queued, see the disposed field. Track teardown awaits this before it destroys
   * the audio level monitor and drops its visibilitychange listener, so nothing here may await
   * plugin code - and nothing here may throw either, or that listener survives on a torn down track
   * and the next foreground event re-acquires the mic after the user has left the room.
   */
  async cleanup() {
    this.disposed = true;
    for (const [name, plugin] of Array.from(this.pluginsMap)) {
      this.stopPlugin(name, plugin, 'at teardown');
      this.unregister(name);
    }
    // Startup opens usage before registration and may still be pending at teardown.
    this.analytics.cleanup();
    this.disconnectNodes();
    // updateProcessedTrack logs the failure, and there is nothing left to fall back to from here
    await this.updateProcessedTrack(undefined).catch(() => {});
  }

  //Keeping it separate since we are initializing context only once
  async closeContext() {
    this.audioContext = undefined;
  }

  async reprocessPlugins() {
    await this.serialize(() => this.rebuildGraph());
  }

  /**
   * Stop every running plugin and drop the node graph, but leave pluginsMap intact so a later
   * reprocess can re-attach them. Used when capture is replaced with the silent empty track:
   * rebuilding against that oscillator would only delay the device error, but skipping teardown
   * entirely left Krisp processing the mic that had just been stopped.
   */
  async releaseGraph() {
    await this.serialize(async () => {
      if (this.disposed) {
        return;
      }
      await this.stopGraph();
    });
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
    if (this.hasNothingToBuild(added)) {
      return;
    }
    await this.stopGraph();
    if (this.disposed) {
      this.throwIfDisposedForAdd(added);
      return;
    }

    const plugins = Array.from(this.pluginsMap.values());
    if (added) {
      plugins.push(added);
    }

    let failures = new Map<string, HMSException>();
    if (plugins.length > 0) {
      this.initAudioNodes();
      failures = await this.startPlugins(plugins);
      if (this.disposed) {
        // startPlugins unwound what it had started, a cleanup published the native track already
        this.reportFailures(failures, added);
        this.throwIfDisposedForAdd(added);
        return;
      }
    }

    await this.publishGraph();
    this.reportFailures(failures, added);
    this.throwIfDisposedForAdd(added);
  }

  /**
   * A rebuild restarts every plugin, so one call can produce failures for plugins the caller never
   * mentioned. It gets the failure of the plugin it asked about, and the collateral ones reach the
   * app as audioPluginFailed instead of as the wrong promise's rejection. A reprocess asked about
   * none of them, so all of its failures go out as events and it resolves.
   */
  private reportFailures(failures: Map<string, HMSException>, added?: HMSAudioPlugin) {
    const requested = added?.getName?.();
    let own: HMSException | undefined;
    for (const [name, failure] of failures) {
      if (name === requested) {
        own = failure;
      } else {
        this.eventBus.audioPluginFailed.publish(failure);
      }
    }
    if (own) {
      throw own;
    }
  }

  /**
   * Nothing is wired up and nothing is being added. The majority of sessions never use an audio
   * plugin, and a device change there must not churn the sender with a redundant replaceTrack.
   */
  private hasNothingToBuild(added?: HMSAudioPlugin) {
    return !added && this.pluginsMap.size === 0 && !this.outputTrack;
  }

  private async stopGraph() {
    if (this.outputTrack) {
      // Keep native audio publishing while the replacement graph initializes.
      await this.updateProcessedTrack(undefined);
    }
    // a plugin cannot be re-inited while it is still running
    for (const [name, plugin] of this.pluginsMap) {
      this.stopPlugin(name, plugin, 'before rebuild');
      // Record this usage interval before restarting the plugin resets its timestamp.
      this.analytics.removed(name);
    }
    this.disconnectNodes();
  }

  /** publishes the rebuilt graph, or goes back to the native track if there is nothing to publish */
  private async publishGraph() {
    if (this.disposed) {
      return;
    }
    if (this.pluginsMap.size > 0 && this.connectToDestination()) {
      await this.updateProcessedTrack(this.outputTrack);
      if (this.disposed) {
        // cleanup already published native; this publish may have landed after it
        await this.updateProcessedTrack(undefined).catch(() => {});
      }
      return;
    }
    if (this.disposed) {
      return;
    }
    HMSLogger.i(this.TAG, 'no plugin output to publish, going back to the native track');
    this.disconnectNodes();
    await this.updateProcessedTrack(undefined);
  }

  /**
   * Starts and chains every plugin in order, dropping the ones that fail. Returns their failures
   * keyed by plugin name so the caller can report each one to whoever asked for that plugin.
   */
  private async startPlugins(plugins: HMSAudioPlugin[]) {
    const failures = new Map<string, HMSException>();
    for (const plugin of plugins) {
      const name = plugin.getName?.();
      try {
        await this.startPlugin(plugin);
      } catch (err) {
        // normalized here, where every route out of startPlugin lands: analytics.failure reads
        // toAnalyticsProperties off it, and an untyped error would throw out of this catch and cost
        // the healthy plugins the graph this rebuild has already dismantled
        const failure = this.toPluginError(err);
        HMSLogger.e(this.TAG, `failed to start plugin ${name}, dropping it`, failure);
        // before unregister ends the usage interval: otherwise this is reported as a plugin the user
        // turned off right after enabling it, and "how often does Krisp drop" stays unanswerable
        this.analytics.failure(name, failure);
        this.unregister(name);
        failures.set(name, failure);
        continue;
      }
      if (this.disposed) {
        /**
         * A teardown landed inside this plugin's own code. cleanup stops what is registered, and
         * this plugin finished starting after it ran, so it is running again and ours to stop.
         */
        HMSLogger.w(this.TAG, `torn down while starting ${name}, dropping the graph`);
        this.stopPlugin(name, plugin, 'after teardown during start');
        this.unregister(name);
        this.disconnectNodes();
        return failures;
      }
      this.pluginsMap.set(name, plugin);
    }
    return failures;
  }

  /**
   * Everything that has to hold every time a plugin is wired into the graph, on a fresh add and on
   * every rebuild alike: the room policy and the device support are both re-checked, because a
   * template change or a mic switch can turn either of them against a plugin mid-session.
   */
  private async startPlugin(plugin: HMSAudioPlugin) {
    const name = plugin.getName?.();
    // re-added on every rebuild so both checks below are reported against a live analytics record,
    // otherwise a plugin dropped on a device switch shows up as one the user turned off
    this.analytics.added(name, this.audioContext!.sampleRate);
    this.checkRoomPolicy(name);
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
      if (!currentNode) {
        // without a node the chain ends nowhere and the destination we publish is fed by nothing,
        // which no client side check can see: the level monitor reads the mic. Drop the plugin.
        throw Error(`plugin ${name} returned no audio node`);
      }
      // the previous plugin was the end of the chain, extend it with this one
      this.prevAudioNode?.connect(currentNode);
      this.prevAudioNode = currentNode;
    } catch (err) {
      // This startup may own resources even if an earlier instance was already stopped.
      plugin.stop();
      throw err;
    }
  }

  /**
   * Everything a dropped plugin reports carries a code, so the app gets an error it can switch on
   * and analytics.failure can report it. init failures are already wrapped by initWithTime, but a
   * plugin's own checkSupport or processAudioTrack can reject with anything.
   */
  private stopPlugin(name: string, plugin: HMSAudioPlugin, when: string) {
    try {
      plugin.stop();
    } catch (err) {
      HMSLogger.e(this.TAG, `error in stopping plugin ${name} ${when}`, err);
    }
  }

  private throwIfDisposedForAdd(added?: HMSAudioPlugin) {
    if (!this.disposed || !added) {
      return;
    }
    throw ErrorFactory.MediaPluginErrors.ProcessingFailed(HMSAction.AUDIO_PLUGINS, 'cannot add plugin after cleanup');
  }

  private toPluginError(err: unknown) {
    if (err instanceof HMSException) {
      return err;
    }
    HMSLogger.e(this.TAG, 'plugin failed with an untyped error', err);
    return ErrorFactory.MediaPluginErrors.ProcessingFailed(
      HMSAction.AUDIO_PLUGINS,
      (err as Error)?.message || String(err),
    );
  }

  private checkRoomPolicy(name: string) {
    if (name === 'HMSKrispPlugin' && !this.room?.isNoiseCancellationEnabled) {
      throw ErrorFactory.MediaPluginErrors.NotAllowedForRoom(
        HMSAction.AUDIO_PLUGINS,
        'Krisp Noise Cancellation is not enabled for this room',
      );
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

  /** @returns whether the end of the chain is really connected to the node we are about to publish */
  private connectToDestination() {
    if (!this.prevAudioNode || !this.destinationNode || this.prevAudioNode.context !== this.destinationNode.context) {
      HMSLogger.e(this.TAG, 'no usable output node for the plugin graph', {
        hasChain: Boolean(this.prevAudioNode),
        hasDestination: Boolean(this.destinationNode),
      });
      return false;
    }
    try {
      this.prevAudioNode.connect(this.destinationNode);
      return true;
    } catch (err) {
      HMSLogger.e(this.TAG, 'error in connecting to destination node', err);
      return false;
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
