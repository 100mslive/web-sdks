import { HMSVideoResolution } from './index';
import { HMSVideoCodec } from '../codec';

export class HMSVideoTrackSettingsBuilder {
  private _resolution: HMSVideoResolution = new HMSVideoResolution(320, 180);
  private _codec: HMSVideoCodec = HMSVideoCodec.VP8;
  private _maxFrameRate: number = 24;
  private _maxBitRate: number = 150_000;
  private _deviceId: string = 'default';
  private _advanced: Array<MediaTrackConstraintSet> = [];

  resolution(resolution: HMSVideoResolution) {
    this._resolution = resolution;
    return this;
  }

  codec(codec: HMSVideoCodec) {
    this._codec = codec;
    return this;
  }

  maxFrameRate(maxFrameRate: number) {
    if (maxFrameRate <= 0) throw Error('maxFrameRate should be >= 1');
    this._maxFrameRate = maxFrameRate;
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
    return new HMSVideoTrackSettings(
      this._resolution,
      this._codec,
      this._maxFrameRate,
      this._maxBitRate,
      this._deviceId,
      this._advanced
    );
  }
}

export default class HMSVideoTrackSettings {
  readonly resolution: HMSVideoResolution;
  readonly codec: HMSVideoCodec;
  readonly maxFrameRate: number;
  readonly maxBitRate: number;
  readonly deviceId: string;
  readonly advanced: Array<MediaTrackConstraintSet>;

  constructor(
    resolution: HMSVideoResolution,
    codec: HMSVideoCodec,
    maxFrameRate: number,
    maxBitRate: number,
    deviceId: string,
    advanced: Array<MediaTrackConstraintSet>
  ) {
    this.resolution = resolution;
    this.codec = codec;
    this.maxFrameRate = maxFrameRate;
    this.maxBitRate = maxBitRate;
    this.deviceId = deviceId;
    this.advanced = advanced;
  }

  toConstraints(): MediaTrackConstraints {
    return {
      width: this.resolution.width,
      height: this.resolution.height,
      frameRate: this.maxFrameRate,
      deviceId: this.deviceId,
    };
  }
}
