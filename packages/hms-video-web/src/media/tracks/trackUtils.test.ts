import { getClosestLayer } from './trackUtils';
import { HMSSimulcastLayer, HMSSimulcastLayerDefinition } from '../../interfaces';

describe('test closest layer with 720p as high', () => {
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
    expect(getClosestLayer(layerDefinitions, { width, height })).toBe(HMSSimulcastLayer.HIGH);
  });

  test('closest layer should be low', () => {
    const width = 284;
    const height = 207;
    expect(getClosestLayer(layerDefinitions, { width, height })).toBe(HMSSimulcastLayer.MEDIUM);
  });

  test('closest layer should be medium', () => {
    const width = 360;
    const height = 360;
    expect(getClosestLayer(layerDefinitions, { width, height })).toBe(HMSSimulcastLayer.MEDIUM);
  });

  test('closest layer should be high', () => {
    const width = 720;
    const height = 1280;
    expect(getClosestLayer(layerDefinitions, { width, height })).toBe(HMSSimulcastLayer.HIGH);
  });
});

describe('test closest layer with 540p as high', () => {
  const layerDefinitions: HMSSimulcastLayerDefinition[] = [
    {
      layer: HMSSimulcastLayer.HIGH,
      resolution: {
        width: 960,
        height: 540,
      },
    },
    {
      layer: HMSSimulcastLayer.MEDIUM,
      resolution: {
        width: 426,
        height: 240,
      },
    },
    {
      layer: HMSSimulcastLayer.LOW,
      resolution: {
        width: 160,
        height: 90,
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
    expect(getClosestLayer(layerDefinitions, { width, height })).toBe(HMSSimulcastLayer.HIGH);
  });

  test('closest layer should be low', () => {
    const width = 284;
    const height = 207;
    expect(getClosestLayer(layerDefinitions, { width, height })).toBe(HMSSimulcastLayer.MEDIUM);
  });

  test('closest layer should be high', () => {
    const width = 360;
    const height = 360;
    expect(getClosestLayer(layerDefinitions, { width, height })).toBe(HMSSimulcastLayer.HIGH);
  });
});
