import HMSVideoTrackSettings from "./HMSVideoTrackSettings";

export enum HMSSimulcastLayer {
  NONE = "none",
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
}

export class HMSVideoResolution {
  readonly width: number;
  readonly height: number;

  constructor(width: number, height: number) {
    if (width <= 0) throw Error("Height should be >= 1");
    if (height <= 0) throw Error("Height should be >= 1");

    this.width = width;
    this.height = height;
  }
}

export const DefaultVideoSettings = {
  QVGA: new HMSVideoTrackSettings.Builder()
      .resolution(new HMSVideoResolution(320, 180))
      .maxBitRate(150_000)
      .build(),
  VGA: new HMSVideoTrackSettings.Builder()
      .resolution(new HMSVideoResolution(640, 360))
      .maxBitRate(500_000)
      .build(),
  SHD: new HMSVideoTrackSettings.Builder()
      .resolution(new HMSVideoResolution(960, 540))
      .maxBitRate(1_200_000)
      .build(),
  HD: new HMSVideoTrackSettings.Builder()
      .resolution(new HMSVideoResolution(1280, 720))
      .maxBitRate(2_500_000)
      .build(),
  FHD: new HMSVideoTrackSettings.Builder()
      .resolution(new HMSVideoResolution(1920, 1080))
      .maxBitRate(4_000_000)
      .build(),
  QHD: new HMSVideoTrackSettings.Builder()
      .resolution(new HMSVideoResolution(2560, 1440))
      .maxBitRate(8_000_000)
      .build(),
};