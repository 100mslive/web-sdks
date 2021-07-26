import { HMSVideoPlugin, HMSVideoPluginType } from './HMSVideoPlugin';
import { HMSLocalVideoTrack } from '../../media/tracks';
import HMSLogger from '../../utils/logger';
import { sleep } from '../../utils/timer-utils';
import { VideoPluginsAnalytics } from './VideoPluginsAnalytics';

const DEFAULT_FRAME_RATE = 24;
const TAG = 'VideoPluginsManager';

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
  /**
   * plugins loop is the loop in which all plugins are applied
   */
  private pluginsLoopRunning: boolean = false;
  private pluginsLoopState: 'paused' | 'running' = 'paused';
  private readonly hmsTrack: HMSLocalVideoTrack;
  private readonly plugins: string[]; // plugin names in order they were added
  private readonly pluginsMap: Record<string, HMSVideoPlugin>; // plugin names to their instance mapping
  private inputVideo?: HTMLVideoElement;
  private inputCanvas?: CanvasElement;
  private outputCanvas?: CanvasElement;
  private outputTrack?: MediaStreamTrack;
  private analytics: VideoPluginsAnalytics;

  constructor(track: HMSLocalVideoTrack) {
    this.hmsTrack = track;
    this.plugins = [];
    this.pluginsMap = {};
    this.analytics = new VideoPluginsAnalytics();
  }

  getPlugins(): string[] {
    return [...this.plugins];
  }

  /**
   * TODO: handle pluginFrameRate
   * @param plugin
   * @param pluginFrameRate
   */
  async addPlugin(plugin: HMSVideoPlugin, pluginFrameRate?: number) {
    try {
      const name = plugin.getName?.();
      if (!name || name === '') {
        HMSLogger.w('no name provided by the plugin');
        return;
      }
      if (this.pluginsMap[name]) {
        HMSLogger.w(TAG, `plugin - ${plugin.getName()} already added.`);
        return;
      }
      const { width, height } = this.hmsTrack.getMediaTrackSettings();
      if (!width || !height || width <= 0 || height <= 0) {
        HMSLogger.i(TAG, 'Track width/height is not valid');
        return;
      }

      HMSLogger.i(TAG, `adding plugin ${plugin.getName()} with framerate ${pluginFrameRate}`);
      this.analytics.added(name);

      if (!plugin.isSupported()) {
        const err = 'Platform not supported';
        this.analytics.failure(name, err as any);
        HMSLogger.i(TAG, `Platform is not supported for plugin - ${plugin.getName()}`);
        return;
      }
      await plugin.init();
      await this.analytics.initWithTime(name, async () => await plugin.init());
      this.plugins.push(plugin.getName());
      this.pluginsMap[plugin.getName()] = plugin;
      await this.startPluginsLoop();
    } catch (err) {
      HMSLogger.e(TAG, 'failed to add plugin');
      await this.removePlugin(plugin);
      throw err;
    }
  }

  async removePlugin(plugin: HMSVideoPlugin) {
    const name = plugin.getName();
    if (!this.pluginsMap[name]) {
      HMSLogger.w(TAG, `plugin - ${name} not found to remove.`);
      return;
    }
    HMSLogger.i(TAG, `removing plugin ${name}`);
    this.removePluginEntry(name);
    if (this.plugins.length == 0) {
      await this.stopPluginsLoop();
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
      await sleep(100);
    }
  }

  /**
   * remove every plugin one by one
   */
  async cleanup() {
    for (const name of this.plugins) {
      await this.removePlugin(this.pluginsMap[name]);
    }
    // memory cleanup
    this.outputTrack?.stop();
  }

  private initElementsAndStream() {
    if (!this.inputCanvas) {
      this.inputCanvas = <CanvasElement>document.createElement('canvas');
    }
    if (!this.outputCanvas) {
      this.outputCanvas = <CanvasElement>document.createElement('canvas');
    }
    if (!this.inputVideo) {
      this.inputVideo = document.createElement('video');
    }
    // FF issue https://bugzilla.mozilla.org/show_bug.cgi?id=1388974
    this.inputCanvas.getContext('2d');
    this.outputCanvas.getContext('2d');
    // capture stream automatically uses the framerate at which the output canvas is changing
    const outputStream = this.outputCanvas.captureStream();
    this.outputTrack = outputStream.getVideoTracks()[0];
  }

  private async startPluginsLoop() {
    if (this.pluginsLoopRunning) {
      return;
    }
    this.initElementsAndStream();
    this.pluginsLoopRunning = true;
    try {
      await this.hmsTrack.setProcessedTrack(this.outputTrack);
    } catch (err) {
      this.pluginsLoopRunning = false;
      throw err;
    }
    // can't await on pluginsLoop as it'll run for a long long time
    this.pluginsLoop().then(() => {
      HMSLogger.d(TAG, 'processLoop stopped');
    });
  }

  private async stopPluginsLoop() {
    this.pluginsLoopRunning = false;
    await this.hmsTrack.setProcessedTrack(undefined);
    this.outputTrack?.stop();
  }

  private async pluginsLoop() {
    while (this.pluginsLoopRunning) {
      const frameRate = this.hmsTrack.getMediaTrackSettings().frameRate || DEFAULT_FRAME_RATE;
      const sleepTimeMs = Math.floor(1000 / frameRate);
      if (!this.hmsTrack.enabled || this.hmsTrack.nativeTrack.readyState === 'ended') {
        if (this.pluginsLoopState === 'running') {
          // mute just happened, reset canvases to black so even if it is sent to remote, it
          // is a black screen instead of a stucked frame from previous run
          this.resetCanvases();
        }
        this.pluginsLoopState = 'paused';
        await sleep(sleepTimeMs);
        continue;
      }
      let processingTime: number = 0;
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
        HMSLogger.e(TAG, 'error in plugins loop', err);
      }
      this.pluginsLoopState = 'running';
      // take into account processing time to decide time to wait for the next loop
      await sleep(sleepTimeMs - processingTime);
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
    for (const name of this.plugins) {
      const plugin = this.pluginsMap[name];
      // TODO: should we use output of previous to pass in to next, instead of passing initial everytime?
      if (plugin.getPluginType() === HMSVideoPluginType.TRANSFORM) {
        await this.analytics.processWithTime(
          name,
          async () => await plugin.processVideoFrame(this.inputCanvas!, this.outputCanvas),
        );
      } else if (plugin.getPluginType() === HMSVideoPluginType.ANALYZE) {
        // there is no need to await for this case
        await this.analytics.processWithTime(name, async () => await plugin.processVideoFrame(this.inputCanvas!));
      }
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
      if (existingTrackID === this.hmsTrack.trackId) {
        // it's already attached
        return;
      }
    }
    this.inputVideo.pause();
    this.inputVideo.srcObject = new MediaStream([this.hmsTrack.nativeTrack]);
    this.inputVideo.muted = true;
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
    const { width, height } = this.hmsTrack.getMediaTrackSettings();
    if (!width || !height || width <= 0 || height <= 0) {
      HMSLogger.w(TAG, 'Invalid width/height of videoTrack', width, height);
      return;
    }
    // TODO: should we reduce height/width to optimize?
    if (this.inputCanvas.height != height) {
      this.inputCanvas.height = height;
    }
    if (this.inputCanvas.width != width) {
      this.inputCanvas.width = width;
    }
    const ctx = this.inputCanvas.getContext('2d');
    ctx!.drawImage(this.inputVideo, 0, 0, width, height);
  }

  //TODO: is this required on cleanup
  // private resetOutputCanvas() {
  //   const ctx = this.outputCanvas?.getContext('2d');
  //   if (this.outputCanvas && ctx) {
  //     ctx.clearRect(0, 0, this.outputCanvas.width, this.outputCanvas.height);
  //   }
  // }

  private resetCanvases() {
    if (!this.outputCanvas || !this.inputCanvas) {
      return;
    }
    const outputCtx = this.outputCanvas.getContext('2d');
    if (outputCtx) {
      outputCtx.fillStyle = `rgb(0, 0, 0)`;
      outputCtx.fillRect(0, 0, this.outputCanvas.width, this.outputCanvas.height);
    }
    const inputCtx = this.inputCanvas.getContext('2d');
    if (inputCtx) {
      inputCtx.fillStyle = `rgb(0, 0, 0)`;
      inputCtx.fillRect(0, 0, this.outputCanvas.width, this.outputCanvas.height);
    }
  }
}
