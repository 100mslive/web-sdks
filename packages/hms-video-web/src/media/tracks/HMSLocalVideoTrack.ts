import { HMSVideoTrack } from './HMSVideoTrack';
import HMSLocalStream from '../streams/HMSLocalStream';
import { HMSVideoTrackSettings, HMSVideoTrackSettingsBuilder } from '../settings';
import { getVideoTrack } from '../../utils/track';
import { HMSVideoPlugin } from '../../plugins';
import { HMSVideoPluginsManager } from '../../plugins/video';
import { HMSVideoTrackSettings as IHMSVideoTrackSettings } from '../../interfaces';
import { DeviceStorageManager } from '../../device-manager/DeviceStorage';
import { EventBus } from '../../events/EventBus';
import { LocalTrackManager } from '../../sdk/LocalTrackManager';

function generateHasPropertyChanged(newSettings: Partial<HMSVideoTrackSettings>, oldSettings: HMSVideoTrackSettings) {
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

  /**
   * @internal
   * This is required for handling remote mute/unmute as the published track will not necessarily be same as
   * the first track id or current native track's id.
   * It won't be same as first track id if the native track was changed after preview started but before join happened,
   * with device change, or mute/unmute.
   * It won't be same as native track id, as the native track can change post join(and publish), when the nativetrack
   * changes, replacetrack is used which doesn't involve republishing which means from server's point of view, the track id
   * is same as what was initially published.
   */
  publishedTrackId: string;

  constructor(
    stream: HMSLocalStream,
    track: MediaStreamTrack,
    source: string,
    private eventBus: EventBus,
    settings: HMSVideoTrackSettings = new HMSVideoTrackSettingsBuilder().build(),
  ) {
    super(stream, track, source);
    stream.tracks.push(this);
    this.settings = settings;
    this.pluginsManager = new HMSVideoPluginsManager(this);
    this.publishedTrackId = this.trackId;
    this.setFirstTrackId(this.trackId);
  }

  /**
   * use this function to set the enabled state of a track. If true the track will be unmuted and muted otherwise.
   * @param value
   */
  async setEnabled(value: boolean): Promise<void> {
    if (value === this.enabled) {
      return;
    }
    if (this.source === 'regular') {
      if (value) {
        await this.replaceTrackWith(this.settings);
      } else {
        await this.replaceTrackWithBlank();
      }
    }
    await super.setEnabled(value);
    this.eventBus.localVideoEnabled.publish(value);
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
  async setSettings(settings: Partial<IHMSVideoTrackSettings>, internal = false) {
    const { width, height, codec, maxFramerate, maxBitrate, deviceId, advanced } = { ...this.settings, ...settings };
    const newSettings = new HMSVideoTrackSettings(width, height, codec, maxFramerate, deviceId, advanced, maxBitrate);

    if (!this.enabled) {
      // if track is muted, we just cache the settings for when it is unmuted
      this.settings = newSettings;
      return;
    }

    const stream = this.stream as HMSLocalStream;
    const hasPropertyChanged = generateHasPropertyChanged(settings, this.settings);

    if (hasPropertyChanged('deviceId') && this.source === 'regular') {
      if (this.enabled) {
        await this.replaceTrackWith(newSettings);
        if (!internal) {
          DeviceStorageManager.updateSelection('videoInput', {
            deviceId: settings.deviceId,
            groupId: this.nativeTrack.getSettings().groupId,
          });
        }
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
  async addPlugin(plugin: HMSVideoPlugin, pluginFrameRate?: number): Promise<void> {
    return this.pluginsManager.addPlugin(plugin, pluginFrameRate);
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
  async cleanup() {
    super.cleanup();
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
    // if all plugins are removed reset everything back to native track
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
   * @internal
   * sent track id will be different in case there was some processing done using plugins.
   * replace track is used to, start sending data from a new track without un publishing the prior one. There
   * are thus two track ids - the one which was initially published and should be unpublished when required.
   * The one whose data is currently being sent, which will be used when removing from connection senders.
   */
  getTrackIDBeingSent() {
    return this.processedTrack ? this.processedTrack.id : this.nativeTrack.id;
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
    const newTrack = LocalTrackManager.getEmptyVideoTrack(prevTrack);
    const localStream = this.stream as HMSLocalStream;
    await localStream.replaceSenderTrack(this.processedTrack || this.nativeTrack, newTrack);
    await localStream.replaceStreamTrack(this.nativeTrack, newTrack);
    this.nativeTrack = newTrack;
  }
}
