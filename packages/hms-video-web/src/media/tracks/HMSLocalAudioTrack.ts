import HMSAudioTrack from "./HMSAudioTrack";
import HMSLocalStream from "../streams/HMSLocalStream";
import HMSAudioTrackSettings from "../settings/HMSAudioTrackSettings";
import {getAudioTrack} from "../../utils/track";

export default class HMSLocalAudioTrack extends HMSAudioTrack {
  private settings: HMSAudioTrackSettings;

  constructor(stream: HMSLocalStream, track: MediaStreamTrack, settings: HMSAudioTrackSettings) {
    super(stream, track);
    stream.tracks.push(this);

    this.settings = settings;
  }

  private async replaceTrackWith(settings: HMSAudioTrackSettings) {
    const withTrack = await getAudioTrack(settings);
    await (this.stream as HMSLocalStream).replaceTrack(this, withTrack);
  }

  async setEnabled(value: boolean) {
    await super.setEnabled(value);
    if (value) {
      await this.replaceTrackWith(this.settings);
    } else {
      this.nativeTrack.stop();
    }
  }

  async setSettings(newSettings: HMSAudioTrackSettings) {
    if (this.settings.codec !== newSettings.codec) {
      throw Error("Audio Codec can't be changed mid call.");
    }

    if (this.settings.deviceId !== newSettings.deviceId) {
      await this.replaceTrackWith(newSettings);
    }

    await this.nativeTrack.applyConstraints(newSettings.toConstraints());
    this.settings = newSettings;
  }
}