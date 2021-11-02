import { HMSAudioTrack } from './HMSAudioTrack';
import HMSLocalStream from '../streams/HMSLocalStream';
import { HMSAudioTrackSettings, HMSAudioTrackSettingsBuilder } from '../settings';
import { getAudioTrack, isEmptyTrack } from '../../utils/track';
import { ITrackAudioLevelUpdate, TrackAudioLevelMonitor } from '../../utils/track-audio-level-monitor';
import { EventReceiver } from '../../utils/typed-event-emitter';
import HMSLogger from '../../utils/logger';
import { HMSAudioPlugin } from '../../plugins';
import { HMSAudioPluginsManager } from '../../plugins/audio';
import { HMSAudioTrackSettings as IHMSAudioTrackSettings } from '../../interfaces';
import { DeviceStorageManager } from '../../device-manager/DeviceStorage';

function generateHasPropertyChanged(newSettings: Partial<HMSAudioTrackSettings>, oldSettings: HMSAudioTrackSettings) {
  return function hasChanged(prop: 'codec' | 'volume' | 'maxBitrate' | 'deviceId' | 'advanced') {
    return prop in newSettings && newSettings[prop] !== oldSettings[prop];
  };
}

const TAG = 'HMSLocalAudioTrack';

export class HMSLocalAudioTrack extends HMSAudioTrack {
  settings: HMSAudioTrackSettings;
  private pluginsManager: HMSAudioPluginsManager;
  private processedTrack?: MediaStreamTrack;

  audioLevelMonitor?: TrackAudioLevelMonitor;

  /**
   * @internal
   */
  publishedTrackId: string;

  constructor(
    stream: HMSLocalStream,
    track: MediaStreamTrack,
    source: string,
    settings: HMSAudioTrackSettings = new HMSAudioTrackSettingsBuilder().build(),
  ) {
    super(stream, track, source);
    stream.tracks.push(this);

    this.settings = settings;
    this.pluginsManager = new HMSAudioPluginsManager(this);
    this.publishedTrackId = this.trackId;
    this.setFirstTrackId(track.id);
  }

  private async replaceTrackWith(settings: HMSAudioTrackSettings) {
    const prevTrack = this.nativeTrack;
    const prevState = this.enabled;
    /**
     * Stop has to be called before getting newTrack as it would cause NotReadableError
     */
    prevTrack?.stop();
    const newTrack = await getAudioTrack(settings);
    newTrack.enabled = prevState;

    const localStream = this.stream as HMSLocalStream;
    // change nativeTrack so plugin can start its work
    await localStream.replaceSenderTrack(prevTrack, this.processedTrack || newTrack);
    await localStream.replaceStreamTrack(prevTrack, newTrack);
    this.nativeTrack = newTrack;
  }

  async setEnabled(value: boolean) {
    if (value === this.enabled) return;

    // Replace silent empty track with an actual audio track, if enabled.
    if (value && isEmptyTrack(this.nativeTrack)) {
      await this.replaceTrackWith(this.settings);
    }
    await super.setEnabled(value);
    (this.stream as HMSLocalStream).trackUpdate(this);
  }

  async setSettings(settings: Partial<IHMSAudioTrackSettings>, internal = false) {
    const { volume, codec, maxBitrate, deviceId, advanced } = { ...this.settings, ...settings };
    const newSettings = new HMSAudioTrackSettings(volume, codec, maxBitrate, deviceId, advanced);

    if (isEmptyTrack(this.nativeTrack)) {
      // if it is an empty track, cache the settings for when it is unmuted
      this.settings = newSettings;
      return;
    }

    const stream = this.stream as HMSLocalStream;
    const hasPropertyChanged = generateHasPropertyChanged(settings, this.settings);

    if (hasPropertyChanged('deviceId')) {
      const isLevelMonitored = Boolean(this.audioLevelMonitor);
      const eventListeners = this.audioLevelMonitor?.listeners('AUDIO_LEVEL_UPDATE');
      HMSLogger.d(TAG, 'Device change', { isLevelMonitored });
      isLevelMonitored && this.destroyAudioLevelMonitor();
      await this.replaceTrackWith(newSettings);
      isLevelMonitored && this.initAudioLevelMonitor(eventListeners);
      if (!internal) {
        DeviceStorageManager.updateSelection('audioInput', {
          deviceId: settings.deviceId,
          groupId: this.nativeTrack.getSettings().groupId,
        });
      }
    }

    if (hasPropertyChanged('maxBitrate')) {
      if (newSettings.maxBitrate) await stream.setMaxBitrate(newSettings.maxBitrate, this);
    }

    if (hasPropertyChanged('advanced')) {
      await this.nativeTrack.applyConstraints(newSettings.toConstraints());
    }

    this.settings = newSettings;
  }

  /**
   * @see HMSAudioPlugin
   */
  getPlugins(): string[] {
    return this.pluginsManager.getPlugins();
  }

  /**
   * @see HMSAudioPlugin
   */
  async addPlugin(plugin: HMSAudioPlugin): Promise<void> {
    return this.pluginsManager.addPlugin(plugin);
  }

  /**
   * @see HMSAudioPlugin
   */
  async removePlugin(plugin: HMSAudioPlugin): Promise<void> {
    return this.pluginsManager.removePlugin(plugin);
  }

  /**
   * @internal
   */
  async setProcessedTrack(processedTrack?: MediaStreamTrack) {
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

  initAudioLevelMonitor(listeners?: EventReceiver<ITrackAudioLevelUpdate | undefined>[] | undefined) {
    HMSLogger.d(TAG, 'Monitor Audio Level for', this, this.getMediaTrackSettings().deviceId);
    this.audioLevelMonitor = new TrackAudioLevelMonitor(this);
    listeners?.forEach((listener) => this.audioLevelMonitor?.on('AUDIO_LEVEL_UPDATE', listener));
    this.audioLevelMonitor.start();
  }

  destroyAudioLevelMonitor() {
    this.audioLevelMonitor?.stop();
    this.audioLevelMonitor = undefined;
  }

  async cleanup() {
    super.cleanup();
    await this.pluginsManager.cleanup();
    this.processedTrack?.stop();
    this.destroyAudioLevelMonitor();
  }

  /**
   * @internal
   * published track id will be different in case there was some processing done using plugins.
   */
  getTrackIDBeingSent() {
    return this.processedTrack ? this.processedTrack.id : this.nativeTrack.id;
  }
}
