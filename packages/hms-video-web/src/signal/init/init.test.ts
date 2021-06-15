import { getUrl, transformInitConfig } from './index';

describe('getUrl', () => {
  it('should return the URL even if unnecesary params are passed to the endpoint', () => {
    expect(getUrl('https://prod-init.100ms.live/something_completely_redundant?this=that', 'in')).toEqual(
      'https://prod-init.100ms.live/init?region=in',
    );
  });

  it('should return the URL with regions if region is provided', () => {
    expect(getUrl('https://prod-init.100ms.live', 'in')).toEqual('https://prod-init.100ms.live/init?region=in');
    expect(getUrl('https://prod-init.100ms.live', 'us')).toEqual('https://prod-init.100ms.live/init?region=us');
    expect(getUrl('https://prod-init.100ms.live', ' in')).toEqual('https://prod-init.100ms.live/init?region=in');
    expect(getUrl('https://prod-init.100ms.live', ' in ')).toEqual('https://prod-init.100ms.live/init?region=in');
    expect(getUrl('https://prod-init.100ms.live', 'in ')).toEqual('https://prod-init.100ms.live/init?region=in');
    expect(getUrl('https://prod-init.100ms.live', ' i n ')).toEqual('https://prod-init.100ms.live/init?region=i+n');
  });

  it('should return the URL without region if region is not provided or invalid', () => {
    expect(getUrl('https://prod-init.100ms.live', ' ')).toEqual('https://prod-init.100ms.live/init');
    expect(getUrl('https://prod-init.100ms.live', '')).toEqual('https://prod-init.100ms.live/init');
    expect(getUrl('https://prod-init.100ms.live')).toEqual('https://prod-init.100ms.live/init');
  });
});

describe('transformInit', () => {
  it('should transform rtcConfiguration returned by the server to correct rtcConfiguration', () => {
    const serverReturnedConfig = {
      endpoint: 'wss://prod-in2.100ms.live/v2/ws',
      rtcConfiguration: {
        ice_servers: [
          {
            urls: ['stun:stun.stunprotocol.org:3478'],
          },
        ],
      },
    };

    const transformedConfig = transformInitConfig(serverReturnedConfig);

    expect(transformedConfig.rtcConfiguration.iceServers).toBeDefined();
    expect(Array.isArray(transformedConfig.rtcConfiguration.iceServers)).toBeTruthy();
  });
});
