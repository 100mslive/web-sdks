import { HMSPreferredSimulcastLayer, HMSSimulcastLayer, HMSSimulcastLayerDefinition } from '../../interfaces';

export const layerToIntMapping = {
  [HMSSimulcastLayer.NONE]: -1,
  [HMSSimulcastLayer.LOW]: 0,
  [HMSSimulcastLayer.MEDIUM]: 1,
  [HMSSimulcastLayer.HIGH]: 2,
};

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
  const layers = [...simulcastLayers].sort((a, b) => layerToIntMapping[a.layer] - layerToIntMapping[b.layer]);
  const aspectRatio = videoElementDimensions.width / videoElementDimensions.height;
  const maxWidth = videoElementDimensions.width * (window?.devicePixelRatio || 1);
  const maxHeight = Math.floor(maxWidth / aspectRatio);
  let minDiff = Number.POSITIVE_INFINITY;
  for (const layer of layers) {
    const diff = Math.min(Math.abs(maxWidth - layer.resolution.width), Math.abs(layer.resolution.height - maxHeight));
    console.log(diff, layer);
    if (diff <= minDiff) {
      minDiff = diff;
      closestLayer = layer.layer;
    }
  }
  return closestLayer;
};
