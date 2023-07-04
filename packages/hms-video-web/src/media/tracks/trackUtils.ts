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
  const layers = [...simulcastLayers].sort((a, b) => layerToIntMapping[a.layer] - layerToIntMapping[b.layer]);
  const v = Math.max(videoElementDimensions.height, videoElementDimensions.width);
  let closestLayer = layers[0].layer;
  for (let i = 1; i < layers.length; i++) {
    const a = Math.max(layers[i - 1].resolution.width, layers[i - 1].resolution.height);
    const b = Math.max(layers[i].resolution.width, layers[i].resolution.height);
    const mid = Math.ceil(a + Math.abs(b - a) * 0.15);

    if (v > mid) {
      closestLayer = layers[i].layer;
    } else {
      break;
    }
  }

  console.log(`chose:${closestLayer} for ${videoElementDimensions.width}x${videoElementDimensions.height}`, layers);
  return closestLayer;
};
