import HMSVideoTrack from './HMSVideoTrack';
import HMSLocalStream from '../streams/HMSLocalStream';
import HMSVideoTrackSettings from '../settings/HMSVideoTrackSettings';
import {getEmptyVideoTrack, getVideoTrack} from '../../utils/track';

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

  private async replaceTrackWithBlackness() {
    const prevTrack = this.nativeTrack;
    const withTrack = getEmptyVideoTrack(prevTrack)
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
      await this.replaceTrackWithBlackness();
    }
  }

  async setSettings(newSettings: HMSVideoTrackSettings) {
    if (this.settings.codec !== newSettings.codec) {
      throw Error("Video Codec can't be changed mid call.");
    }

    if (this.settings.deviceId !== newSettings.deviceId) {
      await this.replaceTrackWith(newSettings);
    }

    await this.nativeTrack.applyConstraints(newSettings.toConstraints());
    this.settings = newSettings;
  }
}
