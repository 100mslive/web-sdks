import HMSVideoTrackSettings, { HMSVideoTrackSettingsBuilder, HMSVideoResolution } from './HMSVideoTrackSettings';
import HMSAudioTrackSettings, { HMSAudioTrackSettingsBuilder } from './HMSAudioTrackSettings';

export const DefaultVideoSettings = {
  QVGA: new HMSVideoTrackSettingsBuilder().resolution(new HMSVideoResolution(320, 180)).maxBitRate(150_000).build(),
  VGA: new HMSVideoTrackSettingsBuilder().resolution(new HMSVideoResolution(640, 360)).maxBitRate(500_000).build(),
  SHD: new HMSVideoTrackSettingsBuilder().resolution(new HMSVideoResolution(960, 540)).maxBitRate(1_200_000).build(),
  HD: new HMSVideoTrackSettingsBuilder().resolution(new HMSVideoResolution(1280, 720)).maxBitRate(2_500_000).build(),
  FHD: new HMSVideoTrackSettingsBuilder().resolution(new HMSVideoResolution(1920, 1080)).maxBitRate(4_000_000).build(),
  QHD: new HMSVideoTrackSettingsBuilder().resolution(new HMSVideoResolution(2560, 1440)).maxBitRate(8_000_000).build(),
};

export class HMSTrackSettingsBuilder {
  private _video: HMSVideoTrackSettings | null = DefaultVideoSettings.QVGA;
  private _audio: HMSAudioTrackSettings | null = new HMSAudioTrackSettingsBuilder().build();
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
      throw Error('There is no media to return. Please select either video or audio or both');
    }

    if (this._video === null && this._simulcast) {
      throw Error('Cannot enable simulcast when no video settings are provided');
    }

    return new HMSTrackSettings(this._video, this._audio, this._simulcast);
  }
}

export default class HMSTrackSettings {
  readonly video: HMSVideoTrackSettings | null;
  readonly audio: HMSAudioTrackSettings | null;
  readonly simulcast: boolean;

  constructor(video: HMSVideoTrackSettings | null, audio: HMSAudioTrackSettings | null, simulcast: boolean) {
    this.video = video;
    this.audio = audio;
    this.simulcast = simulcast;
  }
}
