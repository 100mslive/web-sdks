import { HMSAudioTrack } from './HMSAudioTrack';
import HMSLocalStream from '../streams/HMSLocalStream';
import { HMSAudioTrackSettings, HMSAudioTrackSettingsBuilder } from '../settings';
import { getAudioTrack, isEmptyTrack } from '../../utils/track';
import { ITrackAudioLevelUpdate, TrackAudioLevelMonitor } from '../../utils/track-audio-level-monitor';
import { EventReceiver } from '../../utils/typed-event-emitter';
import HMSLogger from '../../utils/logger';
import { HMSAudioTrackSettings as IHMSAudioTrackSettings } from '../../interfaces';

function generateHasPropertyChanged(newSettings: Partial<HMSAudioTrackSettings>, oldSettings: HMSAudioTrackSettings) {
  return function hasChanged(prop: 'codec' | 'volume' | 'maxBitrate' | 'deviceId' | 'advanced') {
    return prop in newSettings && newSettings[prop] !== oldSettings[prop];
  };
}

const TAG = 'HMSLocalAudioTrack';

export class HMSLocalAudioTrack extends HMSAudioTrack {
  settings: HMSAudioTrackSettings;
  audioLevelMonitor?: TrackAudioLevelMonitor;

  /**
   * @internal
   */
  initiallyPublishedTrackId: string;

  constructor(
    stream: HMSLocalStream,
    track: MediaStreamTrack,
    source: string,
    settings: HMSAudioTrackSettings = new HMSAudioTrackSettingsBuilder().build(),
  ) {
    super(stream, track, source);
    stream.tracks.push(this);

    this.settings = settings;
    this.initiallyPublishedTrackId = this.trackId;
  }

  private async replaceTrackWith(settings: HMSAudioTrackSettings) {
    const prevTrack = this.nativeTrack;
    prevTrack?.stop();
    const newTrack = await getAudioTrack(settings);
    await (this.stream as HMSLocalStream).replaceTrack(this.nativeTrack, newTrack);
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

  async setSettings(settings: Partial<IHMSAudioTrackSettings>) {
    const { volume, codec, maxBitrate, deviceId, advanced } = { ...this.settings, ...settings };
    const newSettings = new HMSAudioTrackSettings(volume, codec, maxBitrate, deviceId, advanced);
    const stream = this.stream as HMSLocalStream;
    const hasPropertyChanged = generateHasPropertyChanged(settings, this.settings);

    if (hasPropertyChanged('deviceId')) {
      const isLevelMonitored = Boolean(this.audioLevelMonitor);
      const eventListeners = this.audioLevelMonitor?.listeners('AUDIO_LEVEL_UPDATE');
      HMSLogger.d(TAG, 'Device change', { isLevelMonitored });
      isLevelMonitored && this.destroyAudioLevelMonitor();
      if (this.enabled) {
        await this.replaceTrackWith(newSettings);
        isLevelMonitored && this.initAudioLevelMonitor(eventListeners);
      }
    }

    if (hasPropertyChanged('maxBitrate')) {
      await stream.setMaxBitrate(newSettings.maxBitrate, this);
    }

    if (hasPropertyChanged('advanced')) {
      await this.nativeTrack.applyConstraints(newSettings.toConstraints());
    }

    this.settings = newSettings;
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

  /**
   * @internal
   * published track id will be different in case there was some processing done using plugins.
   */
  getTrackIDBeingSent() {
    return this.nativeTrack.id;
  }
}
