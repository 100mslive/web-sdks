import { IAnalyticsPropertiesProvider } from '../../analytics/IAnalyticsPropertiesProvider';
import { HMSAudioCodec, HMSAudioTrackSettings as IHMSAudioTrackSettings } from '../../interfaces';

export class HMSAudioTrackSettingsBuilder {
  private _volume = 1.0;
  private _codec?: HMSAudioCodec = HMSAudioCodec.OPUS;
  private _maxBitrate?: number = 32;
  private _deviceId = 'default';
  private _advanced: Array<MediaTrackConstraintSet> = [
    // @ts-ignore
    { googAutoGainControl: true },
    // @ts-ignore
    { googNoiseSuppression: true },
    // @ts-ignore
    { googEchoCancellation: true },
    // @ts-ignore
    { googExperimentalEchoCancellation: true },
    // @ts-ignore
    { googHighpassFilter: true },
    // @ts-ignore
    { googAudioMirroring: true },
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
    this._maxBitrate = maxBitrate;
    return this;
  }

  deviceId(deviceId: string) {
    // TODO: Validate if device-id is OK
    this._deviceId = deviceId;
    return this;
  }

  advanced(advanced: Array<MediaTrackConstraintSet>) {
    this._advanced = advanced;
    return this;
  }

  build() {
    return new HMSAudioTrackSettings(this._volume, this._codec, this._maxBitrate, this._deviceId, this._advanced);
  }
}

export class HMSAudioTrackSettings implements IHMSAudioTrackSettings, IAnalyticsPropertiesProvider {
  readonly volume?: number;
  readonly codec?: HMSAudioCodec;
  readonly maxBitrate?: number;
  readonly deviceId?: string;
  readonly advanced?: Array<MediaTrackConstraintSet>;

  constructor(
    volume?: number,
    codec?: HMSAudioCodec,
    maxBitrate?: number,
    deviceId?: string,
    advanced?: Array<MediaTrackConstraintSet>,
  ) {
    this.volume = volume;
    this.codec = codec;
    this.maxBitrate = maxBitrate;
    this.deviceId = deviceId;
    this.advanced = advanced;
  }

  toConstraints(): MediaTrackConstraints {
    return {
      // @ts-ignore
      mandatory: {
        sourceId: this.deviceId,
      },
      // @ts-ignore - this is changed to apply the constraints with the 'goog' prefix
      optional: this.advanced,
    };
  }

  toAnalyticsProperties() {
    return {
      audio_bitrate: this.maxBitrate,
      audio_codec: this.codec,
    };
  }
}
