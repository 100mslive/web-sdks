import { HMSVideoCodec } from '../codec';

export class HMSVideoResolution {
  readonly width: number;
  readonly height: number;

  constructor(width: number, height: number) {
    if (width <= 0) throw Error('Height should be >= 1');
    if (height <= 0) throw Error('Height should be >= 1');

    this.width = width;
    this.height = height;
  }
}

export class HMSVideoTrackSettingsBuilder {
  private _width: number = 320;
  private _height: number = 180;
  private _codec: HMSVideoCodec = HMSVideoCodec.VP8;
  private _maxFramerate: number = 30;
  private _maxBitrate?: number = 150_000;
  private _deviceId: string = 'default';
  private _advanced: Array<MediaTrackConstraintSet> = [];

  setWidth(width: number) {
    this._width = width;
    return this;
  }

  setHeight(height: number) {
    this._height = height;
    return this;
  }

  codec(codec: HMSVideoCodec) {
    this._codec = codec;
    return this;
  }

  maxFramerate(maxFramerate: number) {
    if (maxFramerate <= 0) throw Error('maxFramerate should be >= 1');
    this._maxFramerate = maxFramerate;
    return this;
  }

  /**
   * @param useDefault Ignored if maxBitrate is valid.
   * If true and maxBitrate is undefined - sets a default value.
   * If false and maxBitrate is undefined - sets undefined.
   */
  maxBitrate(maxBitrate?: number, useDefault = true) {
    if (typeof maxBitrate === 'number' && maxBitrate <= 0) throw Error('maxBitrate should be >= 1');
    this._maxBitrate = maxBitrate;
    if (!this._maxBitrate && useDefault) this._maxBitrate = 150_000;
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
      this._width,
      this._height,
      this._codec,
      this._maxFramerate,
      this._deviceId,
      this._advanced,
      this._maxBitrate,
    );
  }
}

export default class HMSVideoTrackSettings {
  readonly width: number;
  readonly height: number;
  readonly codec: HMSVideoCodec;
  readonly maxFramerate: number;
  readonly maxBitrate?: number;
  readonly deviceId: string;
  readonly advanced: Array<MediaTrackConstraintSet>;

  constructor(
    width: number,
    height: number,
    codec: HMSVideoCodec,
    maxFramerate: number,
    deviceId: string,
    advanced: Array<MediaTrackConstraintSet>,
    maxBitrate?: number,
  ) {
    this.width = width;
    this.height = height;
    this.codec = codec;
    this.maxFramerate = maxFramerate;
    this.maxBitrate = maxBitrate;
    this.deviceId = deviceId;
    this.advanced = advanced;
  }

  toConstraints(): MediaTrackConstraints {
    return {
      width: this.width,
      height: this.height,
      frameRate: this.maxFramerate,
      deviceId: this.deviceId,
    };
  }
}
