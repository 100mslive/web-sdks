import HMSVideoTrack from './HMSVideoTrack';
import HMSLocalStream from '../streams/HMSLocalStream';
import HMSVideoTrackSettings from '../settings/HMSVideoTrackSettings';
import { getVideoTrack } from '../../utils/track';
import { sleep } from '../../utils/sleep';
import { HMSVideoSourceType } from './HMSVideoSourceType';

export default class HMSLocalVideoTrack extends HMSVideoTrack {
  private settings: HMSVideoTrackSettings;

  constructor(
    stream: HMSLocalStream,
    track: MediaStreamTrack,
    settings: HMSVideoTrackSettings,
    videoSourceType: HMSVideoSourceType = HMSVideoSourceType.REGULAR,
  ) {
    super(stream, track, videoSourceType);
    stream.tracks.push(this);

    this.settings = settings;
  }

  private async replaceTrackWith(settings: HMSVideoTrackSettings) {
    const withTrack = await getVideoTrack(settings);
    await (this.stream as HMSLocalStream).replaceTrack(this, withTrack);
  }

  async setEnabled(value: boolean): Promise<void> {
    if (value === this.enabled) return;
    await super.setEnabled(value);

    if (value) {
      await this.replaceTrackWith(this.settings);
    } else {
      // Delay this call such that last frame sent is a black frame.
      await sleep(100);
      this.nativeTrack.stop();
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
