import transformInit from './transform-init-config';

describe('transformInit', () => {
  it('should transform init config returned by the server to correct init config', () => {
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

    const transformedConfig = transformInit(serverReturnedConfig);

    expect(transformedConfig.rtcConfiguration.iceServers).toBeDefined();
    expect(Array.isArray(transformedConfig.rtcConfiguration.iceServers)).toBeTruthy();
  });
});
