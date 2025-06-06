import { IAnalyticsPropertiesProvider } from '../../analytics/IAnalyticsPropertiesProvider';
import { HMSAudioCodec, HMSAudioMode, HMSAudioTrackSettings as IHMSAudioTrackSettings } from '../../interfaces';

export class HMSAudioTrackSettingsBuilder {
  private _volume = 1.0;
  private _codec?: HMSAudioCodec = HMSAudioCodec.OPUS;
  private _maxBitrate?: number = 32;
  private _deviceId = 'default';
  private _audioMode: HMSAudioMode = HMSAudioMode.VOICE;
  private _advanced: Array<MediaTrackConstraintSet> = [
    // @ts-ignore
    { autoGainControl: { exact: true } },
    // @ts-ignore
    { noiseSuppression: { exact: true } },
    // @ts-ignore
    { highpassFilter: { exact: true } },
    // @ts-ignore
    { audioMirroring: { exact: true } },
  ];
  volume(volume: number) {
    if (!(0.0 <= volume && volume <= 1.0)) {
      throw Error('volume can only be in range [0.0, 1.0]');
    }
    this._volume = volume;
    return this;
  }

  codec(codec?: HMSAudioCodec) {
    this._codec = codec;
    return this;
  }

  maxBitrate(maxBitrate?: number) {
    if (maxBitrate && maxBitrate <= 0) {
      throw Error('maxBitrate should be >= 1');
    }
    this._maxBitrate = this._audioMode === HMSAudioMode.MUSIC ? 320 : maxBitrate;
    return this;
  }

  deviceId(deviceId: string) {
    // TODO: Validate if device-id is OK
    this._deviceId = deviceId;
    return this;
  }

  audioMode(mode: HMSAudioMode = HMSAudioMode.VOICE) {
    this._audioMode = mode;
    if (this._audioMode === HMSAudioMode.MUSIC) {
      this._maxBitrate = 320;
    } else {
      this._maxBitrate = 32;
    }
    return this;
  }

  advanced(advanced: Array<MediaTrackConstraintSet>) {
    this._advanced = advanced;
    return this;
  }

  build() {
    return new HMSAudioTrackSettings(
      this._volume,
      this._codec,
      this._maxBitrate,
      this._deviceId,
      this._advanced,
      this._audioMode,
    );
  }
}

export class HMSAudioTrackSettings implements IHMSAudioTrackSettings, IAnalyticsPropertiesProvider {
  readonly volume?: number;
  readonly codec?: HMSAudioCodec;
  readonly maxBitrate?: number;
  readonly deviceId?: string;
  readonly advanced?: Array<MediaTrackConstraintSet>;
  readonly audioMode?: HMSAudioMode;

  constructor(
    volume?: number,
    codec?: HMSAudioCodec,
    maxBitrate?: number,
    deviceId?: string,
    advanced?: Array<MediaTrackConstraintSet>,
    audioMode?: HMSAudioMode,
  ) {
    this.volume = volume;
    this.codec = codec;
    this.maxBitrate = maxBitrate;
    this.deviceId = deviceId;
    this.advanced = advanced;
    this.audioMode = audioMode;
    if (this.audioMode === HMSAudioMode.MUSIC) {
      this.maxBitrate = 320;
    } else {
      this.maxBitrate = 32;
    }
  }

  toConstraints(): MediaTrackConstraints {
    return {
      deviceId: this.deviceId,
      advanced: this.audioMode === HMSAudioMode.MUSIC ? [] : this.advanced,
    };
  }

  toAnalyticsProperties() {
    return {
      audio_bitrate: this.maxBitrate,
      audio_codec: this.codec,
    };
  }
}
