import { getClosestLayer } from './trackUtils';
import { HMSSimulcastLayer, HMSSimulcastLayerDefinition } from '../../interfaces';

describe('test closest layer', () => {
  const layerDefinitions: HMSSimulcastLayerDefinition[] = [
    {
      layer: HMSSimulcastLayer.HIGH,
      resolution: {
        width: 960,
        height: 720,
      },
    },
    {
      layer: HMSSimulcastLayer.MEDIUM,
      resolution: {
        width: 480,
        height: 360,
      },
    },
    {
      layer: HMSSimulcastLayer.LOW,
      resolution: {
        width: 240,
        height: 180,
      },
    },
  ];

  test('closest layer should be high', () => {
    const width = 730;
    const height = 540;
    expect(getClosestLayer(layerDefinitions, { width, height })).toBe(HMSSimulcastLayer.HIGH);
  });

  test('closest layer should be medium', () => {
    const width = 520;
    const height = 390;
    expect(getClosestLayer(layerDefinitions, { width, height })).toBe(HMSSimulcastLayer.MEDIUM);
  });

  test('closest layer should be low', () => {
    const width = 284;
    const height = 207;
    expect(getClosestLayer(layerDefinitions, { width, height })).toBe(HMSSimulcastLayer.LOW);
  });
});
