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
  const width = videoElementDimensions.width;
  const height = videoElementDimensions.height;

  const v = Math.max(width, height);
  let closestLayer = layers[0].layer;
  let chosenMid = 0;
  for (let i = 1; i < layers.length; i++) {
    const a = Math.max(layers[i - 1].resolution.width, layers[i - 1].resolution.height);
    const b = Math.max(layers[i].resolution.width, layers[i].resolution.height);
    const mid = a + Math.abs(b - a) * 0.15;

    if (v > mid) {
      closestLayer = layers[i].layer;
      chosenMid = mid;
    } else {
      break;
    }
  }

  console.log(`chose:${closestLayer} for ${width} x ${height} mid:${chosenMid}`, layers);
  return closestLayer;
};
