import { HMSSimulcastLayer, SimulcastLayerDefinition } from '@100mslive/hms-video-store';
import { getClosestLayer } from './layout';

describe('test closest layer', () => {
  const layerDefinitions: SimulcastLayerDefinition[] = [
    {
      layer: HMSSimulcastLayer.HIGH,
      resolution: {
        width: 854,
        height: 480,
      },
    },
    {
      layer: HMSSimulcastLayer.MEDIUM,
      resolution: {
        width: 427,
        height: 240,
      },
    },
  ];

  test('closest layer should be high', () => {
    const width = 730;
    const height = 540;
    expect(getClosestLayer({ layerDefinitions, width, height })).toBe(HMSSimulcastLayer.HIGH);
  });

  test('closest layer should be medium', () => {
    const width = 284;
    const height = 207;
    expect(getClosestLayer({ layerDefinitions, width, height })).toBe(HMSSimulcastLayer.MEDIUM);
  });
});
