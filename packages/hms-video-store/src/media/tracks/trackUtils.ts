import { HMSPreferredSimulcastLayer, HMSSimulcastLayer, HMSSimulcastLayerDefinition } from '../../interfaces';

export const layerToIntMapping = {
  [HMSSimulcastLayer.NONE]: -1,
  [HMSSimulcastLayer.LOW]: 0,
  [HMSSimulcastLayer.MEDIUM]: 1,
  [HMSSimulcastLayer.HIGH]: 2,
};
const DELTA_THRESHOLD = 0.5;

/**
 * Given the simulcast layers and the current video element dimensions, this function finds the
 * layer with dimensions closer to the video element dimensions.
 */
// eslint-disable-next-line complexity
export const getClosestLayer = (
  simulcastLayers: HMSSimulcastLayerDefinition[],
  videoElementDimensions: { width: number; height: number },
): HMSPreferredSimulcastLayer => {
  let closestLayer: HMSPreferredSimulcastLayer = HMSSimulcastLayer.HIGH;
  // when both width and height are equal pick height to select a better quality
  const maxDimension = videoElementDimensions.width > videoElementDimensions.height ? 'width' : 'height';
  const layers = [...simulcastLayers].sort((a, b) => layerToIntMapping[a.layer] - layerToIntMapping[b.layer]);
  const videoDimesion = videoElementDimensions[maxDimension] * (window?.devicePixelRatio || 1);
  for (let i = 0; i < layers.length; i++) {
    const { resolution, layer } = layers[i];
    const layerDimension = resolution[maxDimension];
    // we break here because the layers are already sorted, the next would always be greater if the below condition satisifes
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
