import {HMSVideoResolution} from "./index";
import {HMSVideoCodec} from "../codec";

export default class HMSVideoTrackSettings {
  readonly resolution: HMSVideoResolution;
  readonly codec: HMSVideoCodec;
  readonly maxFrameRate: number;
  readonly maxBitRate: number;
  readonly deviceId: string;

  private constructor(
      resolution: HMSVideoResolution,
      codec: HMSVideoCodec,
      maxFrameRate: number,
      maxBitRate: number,
      deviceId: string,
  ) {
    this.resolution = resolution;
    this.codec = codec;
    this.maxFrameRate = maxFrameRate;
    this.maxBitRate = maxBitRate;
    this.deviceId = deviceId;
  }

  toConstraints(): MediaTrackConstraints {
    return {
      width: this.resolution.width,
      height: this.resolution.height,
      frameRate: this.maxFrameRate,
      deviceId: this.deviceId,
    }
  }

  static Builder = class {
    private _resolution: HMSVideoResolution = new HMSVideoResolution(320, 180);
    private _codec: HMSVideoCodec = HMSVideoCodec.VP8;
    private _maxFrameRate: number = 24;
    private _maxBitRate: number = 150_000;
    private _deviceId: string = "default";

    resolution(resolution: HMSVideoResolution) {
      this._resolution = resolution;
      return this;
    }

    codec(codec: HMSVideoCodec) {
      this._codec = codec;
      return this;
    }

    maxFrameRate(maxFrameRate: number) {
      if (maxFrameRate <= 0) throw Error("maxFrameRate should be >= 1");
      this._maxFrameRate = maxFrameRate;
      return this;
    }

    maxBitRate(maxBitRate: number) {
      if (maxBitRate <= 0) throw Error("maxBitRate should be >= 1");
      this._maxBitRate = maxBitRate;
      return this;
    }

    deviceId(deviceId: string) {
      // TODO: Validate if device-id is OK
      this._deviceId = deviceId;
      return this;
    }

    build() {
      return new HMSVideoTrackSettings(
          this._resolution,
          this._codec,
          this._maxFrameRate,
          this._maxBitRate,
          this._deviceId
      );
    }
  }
}

namespace HMSVideoTrackSettings {
  export type Builder = InstanceType<typeof HMSVideoTrackSettings.Builder>;
}
