import HMSVideoTrackSettings from "./HMSVideoTrackSettings";
import HMSAudioTrackSettings from "./HMSAudioTrackSettings";
import {DefaultVideoSettings} from "./index";

export default class HMSTrackSettings {
  readonly video: HMSVideoTrackSettings | null;
  readonly audio: HMSAudioTrackSettings | null;
  readonly simulcast: boolean;

  private constructor(
      video: HMSVideoTrackSettings | null,
      audio: HMSAudioTrackSettings | null,
      simulcast: boolean,
  ) {
    this.video = video;
    this.audio = audio;
    this.simulcast = simulcast;
  }

  static Builder = class {
    private _video: HMSVideoTrackSettings | null = DefaultVideoSettings.QVGA;
    private _audio: HMSAudioTrackSettings | null = new HMSAudioTrackSettings.Builder().build();
    private _simulcast = false;

    video(video: HMSVideoTrackSettings | null) {
      this._video = video;
      return this;
    }

    audio(audio: HMSAudioTrackSettings | null) {
      this._audio = audio;
      return this;
    }

    simulcast(enabled: boolean) {
      this._simulcast = enabled;
      return this;
    }

    build() {
      if (this._audio === null && this._video === null) {
        throw Error("There is no media to return. Please select either video or audio or both");
      }

      if (this._video === null && this._simulcast) {
        throw Error("Cannot enable simulcast when no video settings are provided");
      }

      return new HMSTrackSettings(
          this._video,
          this._audio,
          this._simulcast
      );
    }
  }
}