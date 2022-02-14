export enum HMSSimulcastLayer {
  NONE = 'none',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export function compareSimulcastLayers(a: HMSSimulcastLayer, b: HMSSimulcastLayer): number {
  const toInt = (layer: HMSSimulcastLayer): number => {
    switch (layer) {
      case HMSSimulcastLayer.HIGH:
        return 3;
      case HMSSimulcastLayer.MEDIUM:
        return 2;
      case HMSSimulcastLayer.LOW:
        return 1;
      case HMSSimulcastLayer.NONE:
        return 0;
    }
  };

  return toInt(a) - toInt(b);
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
