import HMSVideoTrack from './HMSVideoTrack';
import HMSLocalStream from '../streams/HMSLocalStream';
import HMSVideoTrackSettings from '../settings/HMSVideoTrackSettings';
import { getEmptyVideoTrack, getVideoTrack } from '../../utils/track';

function generateHasPropertyChanged(newSettings: HMSVideoTrackSettings, oldSettings: HMSVideoTrackSettings) {
  return function hasChanged(
    prop: 'codec' | 'width' | 'height' | 'maxFramerate' | 'maxBitrate' | 'deviceId' | 'advanced',
  ) {
    return prop in newSettings && newSettings[prop] !== oldSettings[prop];
  };
}

export default class HMSLocalVideoTrack extends HMSVideoTrack {
  settings: HMSVideoTrackSettings;

  constructor(stream: HMSLocalStream, track: MediaStreamTrack, settings: HMSVideoTrackSettings, source: string) {
    super(stream, track, source);
    stream.tracks.push(this);

    this.settings = settings;
  }

  private async replaceTrackWith(settings: HMSVideoTrackSettings) {
    const prevTrack = this.nativeTrack;
    const withTrack = await getVideoTrack(settings);
    await (this.stream as HMSLocalStream).replaceTrack(this, withTrack);
    prevTrack?.stop();
  }

  private async replaceTrackWithBlank() {
    const prevTrack = this.nativeTrack;
    const withTrack = getEmptyVideoTrack(prevTrack);
    await (this.stream as HMSLocalStream).replaceTrack(this, withTrack);
    prevTrack?.stop();
  }

  async setEnabled(value: boolean): Promise<void> {
    if (value === this.enabled) return;
    await super.setEnabled(value);
    (this.stream as HMSLocalStream).trackUpdate(this);
    if (value) {
      await this.replaceTrackWith(this.settings);
    } else {
      await this.replaceTrackWithBlank();
    }
  }

  async setSettings(settings: HMSVideoTrackSettings) {
    const { width, height, codec, maxFramerate, maxBitrate, deviceId, advanced } = { ...this.settings, ...settings };
    const newSettings = new HMSVideoTrackSettings(width, height, codec, maxFramerate, maxBitrate, deviceId, advanced);
    const stream = this.stream as HMSLocalStream;
    const hasPropertyChanged = generateHasPropertyChanged(settings, this.settings);

    if (hasPropertyChanged('deviceId')) {
      await this.replaceTrackWith(newSettings);
    }

    if (hasPropertyChanged('maxBitrate')) {
      await stream.setMaxBitrate(newSettings.maxBitrate, this);
    }

    if (hasPropertyChanged('width') || hasPropertyChanged('height') || hasPropertyChanged('advanced')) {
      await this.nativeTrack.applyConstraints(newSettings.toConstraints());
    }

    this.settings = newSettings;
  }
}
