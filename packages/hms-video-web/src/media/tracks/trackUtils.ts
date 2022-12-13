import { HMSPreferredSimulcastLayer, HMSSimulcastLayer, HMSSimulcastLayerDefinition } from '../../interfaces';

export const layerToIntMapping = {
  [HMSSimulcastLayer.NONE]: -1,
  [HMSSimulcastLayer.LOW]: 0,
  [HMSSimulcastLayer.MEDIUM]: 1,
  [HMSSimulcastLayer.HIGH]: 2,
};
const DELTA_THRESHOLD = 0.5;

export const getClosestLayer = (
  simulcastLayers: HMSSimulcastLayerDefinition[],
  videoResolution: { width: number; height: number },
): HMSPreferredSimulcastLayer => {
  let closestLayer: HMSPreferredSimulcastLayer = HMSSimulcastLayer.HIGH;
  const maxDimension = videoResolution.width >= videoResolution.height ? 'width' : 'height';
  const layers = [...simulcastLayers].sort((a, b) => layerToIntMapping[a.layer] - layerToIntMapping[b.layer]);
  const videoDimesion = videoResolution[maxDimension];
  for (let i = 0; i < layers.length; i++) {
    const { resolution, layer } = layers[i];
    const layerDimension = resolution[maxDimension];
    if (videoDimesion <= layerDimension) {
      closestLayer = layer;
      break;
    } else {
      const nextLayer = layers[i + 1];
      const nextLayerDimension = nextLayer ? nextLayer.resolution[maxDimension] : Number.POSITIVE_INFINITY;
      // calculating which layer this dimension is closer to
      const proximityPercent = (videoDimesion - layerDimension) / (nextLayerDimension - layerDimension);
      if (proximityPercent < DELTA_THRESHOLD) {
        // the element's dimension is closer to the current layer
        closestLayer = layer;
        break;
      }
    }
  }
  return closestLayer;
};
