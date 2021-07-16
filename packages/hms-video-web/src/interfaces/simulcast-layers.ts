export interface SimulcastLayer {
  rid: string;
  scaleResolutionDownBy?: number;
  maxBitrate: number;
  maxFramerate: number;
}

export interface SimulcastDimensions {
  width?: number;
  height?: number;
}

export interface SimulcastLayers extends SimulcastDimensions {
  layers: SimulcastLayer[];
}
