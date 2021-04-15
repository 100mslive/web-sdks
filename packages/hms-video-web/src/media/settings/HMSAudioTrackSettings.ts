import { HMSAudioCodec } from '../codec';

export class HMSAudioTrackSettingsBuilder {
  private _volume: number = 1.0;
  private _codec: HMSAudioCodec = HMSAudioCodec.OPUS;
  private _maxBitRate: number = 32_000;
  private _deviceId: string = 'default';
  private _advanced: Array<MediaTrackConstraintSet> = [
    // @ts-ignore
    { googEchoCancellation: { exact: true } },
    // @ts-ignore
    { googExperimentalEchoCancellation: { exact: true } },
    { autoGainControl: { exact: true } },
    { noiseSuppression: { exact: true } },
    // @ts-ignore
    { googHighpassFilter: { exact: true } },
    // @ts-ignore
    { googAudioMirroring: { exact: true } },
  ];

  volume(volume: number) {
    if (!(0.0 <= volume && volume <= 1.0))
      throw Error('volume can only be in range [0.0, 1.0]');
    this._volume = volume;
    return this;
  }

  codec(codec: HMSAudioCodec) {
    this._codec = codec;
    return this;
  }

  maxBitRate(maxBitRate: number) {
    if (maxBitRate <= 0) throw Error('maxBitRate should be >= 1');
    this._maxBitRate = maxBitRate;
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
    return new HMSAudioTrackSettings(
      this._volume,
      this._codec,
      this._maxBitRate,
      this._deviceId,
      this._advanced
    );
  }
}

export default class HMSAudioTrackSettings {
  readonly volume: number;
  readonly codec: HMSAudioCodec;
  readonly maxBitRate: number;
  readonly deviceId: string;
  readonly advanced: Array<MediaTrackConstraintSet>;

  constructor(
    volume: number,
    codec: HMSAudioCodec,
    maxBitRate: number,
    deviceId: string,
    advanced: Array<MediaTrackConstraintSet>
  ) {
    this.volume = volume;
    this.codec = codec;
    this.maxBitRate = maxBitRate;
    this.deviceId = deviceId;
    this.advanced = advanced;
  }

  toConstraints(): MediaTrackConstraints {
    return {
      deviceId: this.deviceId,
      advanced: this.advanced,
    };
  }
}
