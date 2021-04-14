import HMSVideoTrack from "./HMSVideoTrack";
import HMSLocalStream from "../streams/HMSLocalStream";
import HMSVideoTrackSettings from "../settings/HMSVideoTrackSettings";
import {getVideoTrack} from "../../utils/track";

export default class HMSLocalVideoTrack extends HMSVideoTrack {
  private settings: HMSVideoTrackSettings;

  constructor(stream: HMSLocalStream, track: MediaStreamTrack, settings: HMSVideoTrackSettings) {
    super(stream, track);
    stream.tracks.push(this);

    this.settings = settings;
  }

  private async replaceTrackWith(settings: HMSVideoTrackSettings) {
    const withTrack = await getVideoTrack(settings);
    await (this.stream as HMSLocalStream).replaceTrack(this, withTrack);
  }

  async setEnabled(value: boolean): Promise<void> {
    await super.setEnabled(value);
    if (value) {
      await this.replaceTrackWith(this.settings);
    } else {
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

