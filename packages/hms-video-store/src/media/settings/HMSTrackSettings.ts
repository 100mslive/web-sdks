import { HMSAudioTrackSettings, HMSAudioTrackSettingsBuilder } from './HMSAudioTrackSettings';
import { HMSVideoTrackSettings, HMSVideoTrackSettingsBuilder } from './HMSVideoTrackSettings';
import { IAnalyticsPropertiesProvider } from '../../analytics/IAnalyticsPropertiesProvider';
import { ErrorFactory } from '../../error/ErrorFactory';
import { HMSAction } from '../../error/HMSAction';

export class HMSTrackSettingsBuilder {
  private _video: HMSVideoTrackSettings | null = new HMSVideoTrackSettingsBuilder().build();
  private _audio: HMSAudioTrackSettings | null = new HMSAudioTrackSettingsBuilder().build();
  private _screen: HMSVideoTrackSettings | null = new HMSVideoTrackSettingsBuilder().build();
  private _simulcast = false;

  video(video: HMSVideoTrackSettings | null) {
    this._video = video;
    return this;
  }

  audio(audio: HMSAudioTrackSettings | null) {
    this._audio = audio;
    return this;
  }

  screen(screen: HMSVideoTrackSettings | null) {
    this._screen = screen;
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

    return new HMSTrackSettings(this._video, this._audio, this._simulcast, this._screen || undefined);
  }
}

export class HMSTrackSettings implements IAnalyticsPropertiesProvider {
  readonly video: HMSVideoTrackSettings | null | undefined;
  readonly audio: HMSAudioTrackSettings | null | undefined;
  readonly screen: HMSVideoTrackSettings | null;
  readonly simulcast: boolean;

  constructor(
    video: HMSVideoTrackSettings | null | undefined,
    audio: HMSAudioTrackSettings | null | undefined,
    simulcast: boolean,
    screen: HMSVideoTrackSettings | null = null,
  ) {
    this.video = video;
    this.audio = audio;
    this.simulcast = simulcast;
    this.screen = screen;
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
