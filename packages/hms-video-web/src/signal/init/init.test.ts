import { userAgent } from '../../utils/support';
import { getUrl, transformInitConfig } from './index';

describe('getUrl', () => {
  const ua = new URLSearchParams(`user_agent=${userAgent}`).toString();
  const peerId = '1234';
  it('should return the URL even if unnecesary params are passed to the endpoint', () => {
    expect(getUrl('https://prod-init.100ms.live/something_completely_redundant?this=that', peerId, 'in')).toEqual(
      `https://prod-init.100ms.live/init?region=in&peer_id=${peerId}&${ua}`,
    );
  });

  it('should return the URL with regions if region is provided', () => {
    expect(getUrl('https://prod-init.100ms.live', peerId, 'in')).toEqual(
      `https://prod-init.100ms.live/init?region=in&peer_id=${peerId}&${ua}`,
    );
    expect(getUrl('https://prod-init.100ms.live', peerId, 'us')).toEqual(
      `https://prod-init.100ms.live/init?region=us&peer_id=${peerId}&${ua}`,
    );
    expect(getUrl('https://prod-init.100ms.live', peerId, ' in')).toEqual(
      `https://prod-init.100ms.live/init?region=in&peer_id=${peerId}&${ua}`,
    );
    expect(getUrl('https://prod-init.100ms.live', peerId, ' in ')).toEqual(
      `https://prod-init.100ms.live/init?region=in&peer_id=${peerId}&${ua}`,
    );
    expect(getUrl('https://prod-init.100ms.live', peerId, 'in ')).toEqual(
      `https://prod-init.100ms.live/init?region=in&peer_id=${peerId}&${ua}`,
    );
    expect(getUrl('https://prod-init.100ms.live', peerId, ' i n ')).toEqual(
      `https://prod-init.100ms.live/init?region=i+n&peer_id=${peerId}&${ua}`,
    );
  });

  it('should return the URL without region if region is not provided or invalid', () => {
    expect(getUrl('https://prod-init.100ms.live', peerId, ' ')).toEqual(
      `https://prod-init.100ms.live/init?peer_id=${peerId}&${ua}`,
    );
    expect(getUrl('https://prod-init.100ms.live', peerId, '')).toEqual(
      `https://prod-init.100ms.live/init?peer_id=${peerId}&${ua}`,
    );
    expect(getUrl('https://prod-init.100ms.live', peerId)).toEqual(
      `https://prod-init.100ms.live/init?peer_id=${peerId}&${ua}`,
    );
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
