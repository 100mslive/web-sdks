import HMSAudioTrack from './HMSAudioTrack';
import HMSLocalStream from '../streams/HMSLocalStream';
import HMSAudioTrackSettings from '../settings/HMSAudioTrackSettings';
import { getAudioTrack } from '../../utils/track';

function generateHasPropertyChanged(newSettings: HMSAudioTrackSettings, oldSettings: HMSAudioTrackSettings) {
  return function hasChanged(prop: 'codec' | 'volume' | 'maxBitrate' | 'deviceId' | 'advanced') {
    return prop in newSettings && newSettings[prop] !== oldSettings[prop];
  };
}

export default class HMSLocalAudioTrack extends HMSAudioTrack {
  settings: HMSAudioTrackSettings;

  constructor(stream: HMSLocalStream, track: MediaStreamTrack, settings: HMSAudioTrackSettings, source: string) {
    super(stream, track, source);
    stream.tracks.push(this);

    this.settings = settings;
  }

  private async replaceTrackWith(settings: HMSAudioTrackSettings) {
    const prevTrack = this.nativeTrack;
    const withTrack = await getAudioTrack(settings);
    await (this.stream as HMSLocalStream).replaceTrack(this, withTrack);
    prevTrack?.stop();
  }

  async setEnabled(value: boolean) {
    if (value === this.enabled) return;
    await super.setEnabled(value);
    (this.stream as HMSLocalStream).trackUpdate(this);
  }

  async setSettings(settings: HMSAudioTrackSettings) {
    const { volume, codec, maxBitrate, deviceId, advanced } = { ...this.settings, ...settings };
    const newSettings = new HMSAudioTrackSettings(volume, codec, maxBitrate, deviceId, advanced);
    const stream = this.stream as HMSLocalStream;
    const hasPropertyChanged = generateHasPropertyChanged(settings, this.settings);

    if (hasPropertyChanged('deviceId')) {
      await this.replaceTrackWith(newSettings);
    }

    if (hasPropertyChanged('maxBitrate')) {
      await stream.setMaxBitrate(newSettings.maxBitrate, this);
    }

    if (hasPropertyChanged('advanced')) {
      await this.nativeTrack.applyConstraints(newSettings.toConstraints());
    }

    this.settings = newSettings;
  }
}
