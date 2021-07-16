import { HMSVideoTrackSettings, HMSVideoTrackSettingsBuilder } from './HMSVideoTrackSettings';
import { HMSAudioTrackSettings, HMSAudioTrackSettingsBuilder } from './HMSAudioTrackSettings';
import { ErrorFactory, HMSAction } from '../../error/ErrorFactory';
import { IAnalyticsPropertiesProvider } from '../../analytics/IAnalyticsPropertiesProvider';

export class HMSTrackSettingsBuilder {
  private _video: HMSVideoTrackSettings | null = new HMSVideoTrackSettingsBuilder().build();
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
      throw ErrorFactory.TracksErrors.NothingToReturn(HMSAction.TRACK);
    }

    if (this._video === null && this._simulcast) {
      throw ErrorFactory.TracksErrors.InvalidVideoSettings(
        HMSAction.TRACK,
        'Cannot enable simulcast when no video settings are provided',
      );
    }

    return new HMSTrackSettings(this._video, this._audio, this._simulcast);
  }
}

export class HMSTrackSettings implements IAnalyticsPropertiesProvider {
  readonly video: HMSVideoTrackSettings | null;
  readonly audio: HMSAudioTrackSettings | null;
  readonly simulcast: boolean;

  constructor(video: HMSVideoTrackSettings | null, audio: HMSAudioTrackSettings | null, simulcast: boolean) {
    this.video = video;
    this.audio = audio;
    this.simulcast = simulcast;
  }

  toAnalyticsProperties() {
    let properties = {
      audio_enabled: this.audio !== null,
      video_enabled: this.video !== null,
    };

    if (this.audio) {
      properties = { ...this.audio.toAnalyticsProperties(), ...properties };
    }

    if (this.video) {
      properties = { ...this.video.toAnalyticsProperties(), ...properties };
    }

    return properties;
  }
}
