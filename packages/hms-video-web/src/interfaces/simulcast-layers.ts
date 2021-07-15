export interface HMSSimulcastLayer {
  rid: string;
  scaleResolutionDownBy?: number;
  maxBitrate: number;
  maxFramerate: number;
}

export interface SimulcastDimensions {
  width?: number;
  height?: number;
}

export interface HMSSimulcastLayers extends SimulcastDimensions {
  layers: HMSSimulcastLayer[];
}
