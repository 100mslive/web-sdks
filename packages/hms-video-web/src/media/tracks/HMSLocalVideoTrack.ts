import { HMSVideoTrack } from './HMSVideoTrack';
import HMSLocalStream from '../streams/HMSLocalStream';
import { HMSVideoTrackSettings, HMSVideoTrackSettingsBuilder } from '../settings';
import { getEmptyVideoTrack, getVideoTrack } from '../../utils/track';
import { HMSVideoPlugin } from '../../plugins';
import { HMSVideoPluginsManager } from '../../plugins/video';

function generateHasPropertyChanged(newSettings: HMSVideoTrackSettings, oldSettings: HMSVideoTrackSettings) {
  return function hasChanged(
    prop: 'codec' | 'width' | 'height' | 'maxFramerate' | 'maxBitrate' | 'deviceId' | 'advanced',
  ) {
    return prop in newSettings && newSettings[prop] !== oldSettings[prop];
  };
}

export class HMSLocalVideoTrack extends HMSVideoTrack {
  settings: HMSVideoTrackSettings;
  private pluginsManager: HMSVideoPluginsManager;
  private processedTrack?: MediaStreamTrack;

  constructor(
    stream: HMSLocalStream,
    track: MediaStreamTrack,
    source: string,
    settings: HMSVideoTrackSettings = new HMSVideoTrackSettingsBuilder().build(),
  ) {
    super(stream, track, source);
    stream.tracks.push(this);
    this.settings = settings;
    this.pluginsManager = new HMSVideoPluginsManager(this);
  }

  /**
   * use this function to set the enabled state of a track. If true the track will be unmuted and muted otherwise.
   * @param value
   */
  async setEnabled(value: boolean): Promise<void> {
    if (value === this.enabled) return;
    if (this.source === 'regular') {
      if (value) {
        await this.replaceTrackWith(this.settings);
      } else {
        await this.replaceTrackWithBlank();
      }
    }
    await super.setEnabled(value);
    (this.stream as HMSLocalStream).trackUpdate(this);
  }

  /**
   * @see HMSVideoTrack#addSink()
   */
  addSink(videoElement: HTMLVideoElement) {
    this.addSinkInternal(videoElement, this.processedTrack || this.nativeTrack);
  }

  /**
   * This function can be used to set media track settings. Frequent options -
   * deviceID: can be used to change to different input source
   * width, height - can be used to change capture dimensions
   * maxFramerate - can be used to control the capture framerate
   * @param settings
   */
  async setSettings(settings: HMSVideoTrackSettings) {
    const { width, height, codec, maxFramerate, maxBitrate, deviceId, advanced } = { ...this.settings, ...settings };
    const newSettings = new HMSVideoTrackSettings(width, height, codec, maxFramerate, deviceId, advanced, maxBitrate);
    const stream = this.stream as HMSLocalStream;
    const hasPropertyChanged = generateHasPropertyChanged(settings, this.settings);

    if (hasPropertyChanged('deviceId') && this.source === 'regular') {
      if (this.enabled) {
        await this.replaceTrackWith(newSettings);
      }
    }

    if (hasPropertyChanged('maxBitrate') && newSettings.maxBitrate) {
      await stream.setMaxBitrate(newSettings.maxBitrate, this);
    }

    if (hasPropertyChanged('width') || hasPropertyChanged('height') || hasPropertyChanged('advanced')) {
      await this.nativeTrack.applyConstraints(newSettings.toConstraints());
    }

    this.settings = newSettings;
  }

  /**
   * @see HMSVideoPlugin
   */
  getPlugins(): string[] {
    return this.pluginsManager.getPlugins();
  }

  /**
   * @see HMSVideoPlugin
   */
  async addPlugin(plugin: HMSVideoPlugin): Promise<void> {
    return this.pluginsManager.addPlugin(plugin);
  }

  /**
   * @see HMSVideoPlugin
   */
  async removePlugin(plugin: HMSVideoPlugin): Promise<void> {
    return this.pluginsManager.removePlugin(plugin);
  }

  /**
   * @internal
   */
  async cleanupPlugins() {
    await this.pluginsManager.cleanup();
    this.processedTrack?.stop();
  }

  /**
   * once the plugin manager has done its processing it can set or remove processed track via this method
   * note that replacing sender track only makes sense if the native track is enabled. if it's disabled there is
   * no point in replacing it. We'll update the processed track variable though so next time unmute happens
   * it's set properly.
   * @internal
   */
  async setProcessedTrack(processedTrack?: MediaStreamTrack) {
    // required replacement will happen when video is unmuted
    if (!this.nativeTrack.enabled) {
      this.processedTrack = processedTrack;
      return;
    }
    if (!processedTrack) {
      if (this.processedTrack) {
        // remove, reset back to the native track
        await (this.stream as HMSLocalStream).replaceSenderTrack(this.processedTrack, this.nativeTrack);
      }
      this.processedTrack = undefined;
      return;
    }
    if (processedTrack !== this.processedTrack) {
      if (this.processedTrack) {
        // replace previous processed track with new one
        await (this.stream as HMSLocalStream).replaceSenderTrack(this.processedTrack, processedTrack);
      } else {
        // there is no prev processed track, replace native with new one
        await (this.stream as HMSLocalStream).replaceSenderTrack(this.nativeTrack, processedTrack);
      }
      this.processedTrack = processedTrack;
    }
  }

  /**
   * called when the video is unmuted
   * @private
   */
  private async replaceTrackWith(settings: HMSVideoTrackSettings) {
    const prevTrack = this.nativeTrack;
    prevTrack?.stop();
    const newTrack = await getVideoTrack(settings);
    const localStream = this.stream as HMSLocalStream;
    // change nativeTrack so plugin can start its work
    await localStream.replaceSenderTrack(prevTrack, this.processedTrack || newTrack);
    await localStream.replaceStreamTrack(prevTrack, newTrack);
    this.nativeTrack = newTrack;
    await this.pluginsManager.waitForRestart();
  }

  /**
   * called when the video is muted. A blank track is used to replace the original track. This is in order to
   * turn off the camera light and keep the bytes flowing to avoid av sync, timestamp issues.
   * @private
   */
  private async replaceTrackWithBlank() {
    const prevTrack = this.nativeTrack;
    prevTrack?.stop();
    const newTrack = getEmptyVideoTrack(prevTrack);
    const localStream = this.stream as HMSLocalStream;
    await localStream.replaceSenderTrack(this.processedTrack || this.nativeTrack, newTrack);
    await localStream.replaceStreamTrack(this.nativeTrack, newTrack);
    this.nativeTrack = newTrack;
  }
}
