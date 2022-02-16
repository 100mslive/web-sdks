export enum HMSSimulcastLayer {
  NONE = 'none',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

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

export interface SimulcastLayerDefinition {
  layer: Exclude<HMSSimulcastLayer, HMSSimulcastLayer.NONE>;
  resolution: SimulcastDimensions;
}

export type RID = 'f' | 'h' | 'q';

export const simulcastMapping = {
  f: HMSSimulcastLayer.HIGH,
  h: HMSSimulcastLayer.MEDIUM,
  q: HMSSimulcastLayer.LOW,
};
