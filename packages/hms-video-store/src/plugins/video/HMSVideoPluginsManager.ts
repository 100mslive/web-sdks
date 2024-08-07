/* eslint-disable complexity */
import { HMSVideoPlugin, HMSVideoPluginCanvasContextType, HMSVideoPluginType } from './HMSVideoPlugin';
import { VideoPluginsAnalytics } from './VideoPluginsAnalytics';
import { ErrorFactory } from '../../error/ErrorFactory';
import { HMSAction } from '../../error/HMSAction';
import { EventBus } from '../../events/EventBus';
import { HMSLocalVideoTrack } from '../../media/tracks';
import HMSLogger from '../../utils/logger';
import { reusableWorker, workerSleep } from '../../utils/timer-utils';
import { HMSPluginUnsupportedTypes } from '../audio';

const DEFAULT_FRAME_RATE = 24;
const DEFAULT_WIDTH = 320;
const DEFAULT_HEIGHT = 240;

interface CanvasElement extends HTMLCanvasElement {
  captureStream(frameRate?: number): MediaStream;
}

/**
 * This class manages applying different plugins on a local video track. Plugins which need to modify the video
 * are called in the order they were added. Plugins which do not need to modify the video frames are called
 * with the original input.
 *
 * Concepts -
 * Video Plugin - A module which can take in input video painted on a canvas, do some processing on it and optionally
 * render its output on a passed in output canvas which will be shown in the UI.
 *
 * frameRate - the frame rate of the input video as present in track.getSettings, this is the rate at which new frames
 * are being produced and the rate we need to maintain in output as well.
 *
 * pluginFrameRate - this is the rate at which the plugin is supposed to do its processing. The processing can be an
 * expensive operation and can result in high usage of resources like CPU. This rate would usually be lower than the
 * real frame rate.
 *
 * pluginsLoop - a loop is run at framerate in this class, on each loop if the original track is unmuted all added
 * plugins are called one by one in the order they were called.
 *
 * @see HMSVideoPlugin
 */
export class HMSVideoPluginsManager {
  private readonly TAG = '[VideoPluginsManager]';

  /**
   * plugins loop is the loop in which all plugins are applied
   */
  private pluginsLoopRunning = false;
  private pluginsLoopState: 'paused' | 'running' = 'paused';
  private readonly hmsTrack: HMSLocalVideoTrack;
  readonly pluginsMap: Map<string, HMSVideoPlugin>; // plugin names to their instance mapping
  private inputVideo?: HTMLVideoElement;
  private inputCanvas?: CanvasElement;
  private outputCanvas?: CanvasElement;
  private outputTrack?: MediaStreamTrack;
  private analytics: VideoPluginsAnalytics;
  private pluginAddInProgress = false;
  private pluginNumFramesToSkip: Record<string, number>;
  private pluginNumFramesSkipped: Record<string, number>;
  private canvases: Array<CanvasElement>; //array of canvases to store intermediate result
  private reusableWorker = reusableWorker();

  constructor(track: HMSLocalVideoTrack, eventBus: EventBus) {
    this.hmsTrack = track;
    this.pluginsMap = new Map();
    this.pluginNumFramesToSkip = {};
    this.pluginNumFramesSkipped = {};
    this.analytics = new VideoPluginsAnalytics(eventBus);
    this.canvases = new Array<CanvasElement>();
  }

  getPlugins(): string[] {
    return Array.from(this.pluginsMap.keys());
  }

  /**
   * @param plugin
   * @param pluginFrameRate
   */
  async addPlugin(plugin: HMSVideoPlugin, pluginFrameRate?: number) {
    if (this.pluginAddInProgress) {
      const name = plugin.getName?.();
      if (!name || name === '') {
        HMSLogger.w('no name provided by the plugin');
        return;
      }

      const err = ErrorFactory.MediaPluginErrors.AddAlreadyInProgress(
        HMSAction.VIDEO_PLUGINS,
        'Add Plugin is already in Progress',
      );
      this.analytics.failure(name, err);

      HMSLogger.w("can't add another plugin when previous add is in progress");
      throw err;
    }

    this.pluginAddInProgress = true;

    try {
      await this.addPluginInternal(plugin, pluginFrameRate);
    } finally {
      this.pluginAddInProgress = false;
    }
  }

  private async addPluginInternal(plugin: HMSVideoPlugin, pluginFrameRate?: number) {
    const name = plugin.getName?.();
    if (!name || name === '') {
      HMSLogger.w('no name provided by the plugin');
      return;
    }
    if (this.pluginsMap.has(name)) {
      HMSLogger.w(this.TAG, `plugin - ${plugin.getName()} already added.`);
      return;
    }
    //TODO: assuming this inputFrameRate from getMediaTrackSettings will not change once set
    //TODO: even if it changes will not have the info/params to know the change
    const inputFrameRate = this.hmsTrack.getMediaTrackSettings().frameRate || DEFAULT_FRAME_RATE;

    let numFramesToSkip = 0;
    if (pluginFrameRate && pluginFrameRate > 0) {
      HMSLogger.i(this.TAG, `adding plugin ${plugin.getName()} with framerate ${pluginFrameRate}`);
      if (pluginFrameRate < inputFrameRate) {
        numFramesToSkip = Math.ceil(inputFrameRate / pluginFrameRate) - 1;
      }
      this.analytics.added(name, inputFrameRate, pluginFrameRate);
    } else {
      HMSLogger.i(this.TAG, `adding plugin ${plugin.getName()}`);
      this.analytics.added(name, inputFrameRate);
    }

    HMSLogger.i(this.TAG, 'numFrames to skip processing', numFramesToSkip);
    this.pluginNumFramesToSkip[name] = numFramesToSkip;
    this.pluginNumFramesSkipped[name] = numFramesToSkip;

    this.validateAndThrow(name, plugin);

    try {
      await this.analytics.initWithTime(name, async () => await plugin.init());
      this.pluginsMap.set(name, plugin);
      // add new canvases according to new added plugins
      if (this.pluginsMap.size + 1 > this.canvases.length) {
        for (let i = this.canvases.length; i <= this.pluginsMap.size; i++) {
          this.canvases[i] = document.createElement('canvas') as CanvasElement;
        }
      }
      await this.startPluginsLoop(plugin.getContextType?.());
    } catch (err) {
      HMSLogger.e(this.TAG, 'failed to add plugin', err);
      await this.removePlugin(plugin);
      throw err;
    }
  }

  validatePlugin(plugin: HMSVideoPlugin) {
    return plugin.checkSupport();
  }

  validateAndThrow(name: string, plugin: HMSVideoPlugin) {
    const result = this.validatePlugin(plugin);
    if (result.isSupported) {
      HMSLogger.i(this.TAG, `plugin is supported,- ${plugin.getName()}`);
    } else {
      let error;
      switch (result.errType) {
        case HMSPluginUnsupportedTypes.PLATFORM_NOT_SUPPORTED:
          error = ErrorFactory.MediaPluginErrors.PlatformNotSupported(
            HMSAction.VIDEO_PLUGINS,
            'platform not supported, see docs',
          );
          this.analytics.failure(name, error);
          throw error;
        case HMSPluginUnsupportedTypes.DEVICE_NOT_SUPPORTED:
          error = ErrorFactory.MediaPluginErrors.DeviceNotSupported(
            HMSAction.VIDEO_PLUGINS,
            'video device not supported, see docs',
          );
          this.analytics.failure(name, error);
          throw error;
      }
    }
  }

  async removePlugin(plugin: HMSVideoPlugin) {
    const name = plugin.getName();
    if (!this.pluginsMap.get(name)) {
      HMSLogger.w(this.TAG, `plugin - ${name} not found to remove.`);
      return;
    }
    HMSLogger.i(this.TAG, `removing plugin ${name}`);
    this.removePluginEntry(name);
    if (this.pluginsMap.size === 0) {
      HMSLogger.i(this.TAG, `No plugins left, stopping plugins loop`);
      await this.stopPluginsLoop();
    }
    plugin.stop();
    this.analytics.removed(name);
  }

  removePluginEntry(name: string) {
    this.pluginsMap.delete(name);
    if (this.pluginNumFramesToSkip[name]) {
      delete this.pluginNumFramesToSkip[name];
    }
    if (this.pluginNumFramesSkipped[name]) {
      delete this.pluginNumFramesSkipped[name];
    }
  }

  /**
   * when video is unmuted it takes some time for all the plugins to be re run and an output stream to be
   * produced. It can await on this function to confirm and tell the new unmuted state.
   * If this is not awaited on video will freeze with a frame from past run.
   */
  async waitForRestart() {
    if (!this.pluginsLoopRunning || this.pluginsLoopState === 'running') {
      return;
    }
    while (this.pluginsLoopState === 'paused') {
      await workerSleep(100);
    }
  }

  /**
   * remove every plugin one by one
   */
  async cleanup() {
    for (const plugin of this.pluginsMap.values()) {
      await this.removePlugin(plugin);
    }
    // memory cleanup
    this.outputTrack?.stop();
  }

  private initElementsAndStream(contextType?: HMSVideoPluginCanvasContextType) {
    if (!this.inputCanvas) {
      this.inputCanvas = document.createElement('canvas') as CanvasElement;
    }
    this.outputCanvas = document.createElement('canvas') as CanvasElement;
    if (!this.inputVideo) {
      this.inputVideo = document.createElement('video');
    }
    // FF issue https://bugzilla.mozilla.org/show_bug.cgi?id=1388974
    this.inputCanvas.getContext('2d');
    this.outputCanvas.getContext(contextType || HMSVideoPluginCanvasContextType['2D']);
    // capture stream automatically uses the framerate at which the output canvas is changing
    const outputStream = this.outputCanvas.captureStream();
    this.outputTrack = outputStream.getVideoTracks()[0];
  }

  private async startPluginsLoop(contextType?: HMSVideoPluginCanvasContextType) {
    if (this.pluginsLoopRunning) {
      return;
    }
    this.initElementsAndStream(contextType);
    this.pluginsLoopRunning = true;
    try {
      await this.hmsTrack.setProcessedTrack(this.outputTrack);
    } catch (err) {
      this.pluginsLoopRunning = false;
      HMSLogger.e(this.TAG, 'error in setting processed track', err);
      throw err;
    }
    // can't await on pluginsLoop as it'll run for a long long time
    this.pluginsLoop().then(() => {
      HMSLogger.d(this.TAG, 'processLoop stopped');
    });
  }

  private async stopPluginsLoop() {
    this.pluginsLoopRunning = false;
    await this.hmsTrack.setProcessedTrack(undefined);
    this.resetCanvases();
    this.outputTrack?.stop();
    if (this.inputVideo) {
      this.inputVideo.srcObject = null;
      this.inputVideo = undefined;
    }
  }

  private async pluginsLoop() {
    while (this.pluginsLoopRunning) {
      const inputFrameRate = this.hmsTrack.getMediaTrackSettings().frameRate || DEFAULT_FRAME_RATE;
      const sleepTimeMs = Math.floor(1000 / inputFrameRate);
      if (!this.hmsTrack.enabled || this.hmsTrack.nativeTrack.readyState === 'ended') {
        if (this.pluginsLoopState === 'running') {
          // mute just happened, reset canvases to black so even if it is sent to remote, it
          // is a black screen instead of a stucked frame from previous run
          this.resetCanvases();
        }
        this.pluginsLoopState = 'paused';
        await this.reusableWorker.sleep(sleepTimeMs);
        continue;
      }
      let processingTime = 0;
      try {
        await this.analytics.preProcessWithTime(async () => await this.doPreProcessing());
        const start = Date.now();
        await this.processFramesThroughPlugins();
        processingTime = Math.floor(Date.now() - start);
        if (processingTime > sleepTimeMs) {
          processingTime = sleepTimeMs;
        }
      } catch (err) {
        // TODO: handle failures properly, detect which plugin failed, stop it and notify back to the UI
        HMSLogger.e(this.TAG, 'error in plugins loop', err);
      }
      this.pluginsLoopState = 'running';
      // take into account processing time to decide time to wait for the next loop
      await this.reusableWorker.sleep(sleepTimeMs - processingTime);
    }
  }

  private async doPreProcessing() {
    await this.addTrackToVideo(); // ensure current native track is playing in video
    await this.updateInputCanvas(); // put the latest video frame on input canvas
  }

  /**
   * pass the input canvas through all plugins in a loop
   * @private
   */
  private async processFramesThroughPlugins() {
    this.canvases[0] = this.inputCanvas!;
    let i = 0;
    for (const plugin of this.pluginsMap.values()) {
      const name = plugin.getName();
      if (!plugin) {
        continue;
      }
      try {
        const skipProcessing = this.checkIfSkipRequired(name);

        if (plugin.getPluginType() === HMSVideoPluginType.TRANSFORM) {
          const process = async (input: CanvasElement, output: CanvasElement) => {
            try {
              await plugin.processVideoFrame(input, output, skipProcessing);
            } catch (err) {
              HMSLogger.e(this.TAG, `error in processing plugin ${name}`, err);
            }
          };
          if (!skipProcessing) {
            const currentCanvas = this.canvases[i];
            const nextCanvas = this.canvases[i + 1];
            if (i === this.pluginsMap.size - 1) {
              await this.analytics.processWithTime(name, async () => process(currentCanvas, this.outputCanvas!));
            } else {
              await this.analytics.processWithTime(name, async () => process(currentCanvas, nextCanvas));
            }
          } else {
            if (i === this.pluginsMap.size - 1) {
              await process(this.canvases[i], this.outputCanvas!);
            } else {
              await process(this.canvases[i], this.canvases[i + 1]);
            }
          }
        } else if (plugin.getPluginType() === HMSVideoPluginType.ANALYZE && !skipProcessing) {
          // there is no need to await for this case
          await this.analytics.processWithTime(name, async () => await plugin.processVideoFrame(this.inputCanvas!));
        }
      } catch (err) {
        //TODO error happened on processing of plugin notify UI
        HMSLogger.e(this.TAG, `error in processing plugin ${name}`, err);
        //remove plugin from loop and stop analytics for it
        await this.removePlugin(plugin);
      }
      i++;
    }
  }

  /**
   * add the current native track to the inputVideoElement if it's not already added.
   * @private
   */
  private async addTrackToVideo() {
    if (!this.inputVideo) {
      return;
    }
    const srcObject = this.inputVideo.srcObject;
    if (srcObject !== null && srcObject instanceof MediaStream) {
      const existingTrackID = srcObject.getVideoTracks()[0]?.id;
      if (existingTrackID === this.hmsTrack.nativeTrack.id) {
        // it's already attached
        return;
      }
    }
    this.inputVideo.pause();
    this.inputVideo.srcObject = new MediaStream([this.hmsTrack.nativeTrack]);
    this.inputVideo.muted = true;
    this.inputVideo.playsInline = true;
    await this.inputVideo.play();
  }

  /**
   * get the new video frame from input video element and put it on canvas
   * @private
   */
  private async updateInputCanvas() {
    if (!this.inputCanvas || !this.inputVideo) {
      return;
    }
    const { width = DEFAULT_WIDTH, height = DEFAULT_HEIGHT } = this.hmsTrack.getMediaTrackSettings();
    // TODO: should we reduce height/width to optimize?
    if (this.inputCanvas.height !== height) {
      this.inputCanvas.height = height;
    }
    if (this.inputCanvas.width !== width) {
      this.inputCanvas.width = width;
    }
    const ctx = this.inputCanvas.getContext('2d');
    ctx!.drawImage(this.inputVideo, 0, 0, width, height);
  }

  private resetCanvases() {
    if (!this.outputCanvas || !this.inputCanvas) {
      return;
    }
    const inputCtx = this.inputCanvas.getContext('2d');
    if (inputCtx) {
      inputCtx.fillStyle = `rgb(0, 0, 0)`;
      inputCtx.fillRect(0, 0, this.outputCanvas.width, this.outputCanvas.height);
    }
    this.canvases = [];
  }

  /**
    N = ceil(inputFrameRate/pluginFrameRate) - 1
    N = this.pluginNumFramesToSkip[name] = frames to skip for every processed frame
    all the frames we are skipping are using the previous frame output
   **/
  private checkIfSkipRequired(name: string) {
    let skip = false;

    if (this.pluginNumFramesSkipped[name] < this.pluginNumFramesToSkip[name]) {
      this.pluginNumFramesSkipped[name]++;
      skip = true;
    } else {
      skip = false;
      this.pluginNumFramesSkipped[name] = 0;
    }

    return skip;
  }
}
