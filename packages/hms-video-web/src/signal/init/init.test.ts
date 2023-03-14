import InitService, { getUrl, transformInitConfig } from './index';
import { HMSException } from '../../error/HMSException';
import { ENV } from '../../utils/support';
import { createUserAgent } from '../../utils/user-agent';

describe('getUrl', () => {
  const userAgent = createUserAgent(ENV.PROD);
  const userAgentQueryParam = new URLSearchParams(`user_agent_v2=${userAgent}`).toString();
  const peerId = '1234';
  it('should return the URL even if unnecesary params are passed to the endpoint', () => {
    expect(
      getUrl('https://prod-init.100ms.live/something_completely_redundant?this=that', peerId, userAgent, 'in'),
    ).toEqual(`https://prod-init.100ms.live/init?region=in&peer_id=${peerId}&${userAgentQueryParam}`);
  });

  it('should return the URL with regions if region is provided', () => {
    expect(getUrl('https://prod-init.100ms.live', peerId, userAgent, 'in')).toEqual(
      `https://prod-init.100ms.live/init?region=in&peer_id=${peerId}&${userAgentQueryParam}`,
    );
    expect(getUrl('https://prod-init.100ms.live', peerId, userAgent, 'us')).toEqual(
      `https://prod-init.100ms.live/init?region=us&peer_id=${peerId}&${userAgentQueryParam}`,
    );
    expect(getUrl('https://prod-init.100ms.live', peerId, userAgent, ' in')).toEqual(
      `https://prod-init.100ms.live/init?region=in&peer_id=${peerId}&${userAgentQueryParam}`,
    );
    expect(getUrl('https://prod-init.100ms.live', peerId, userAgent, ' in ')).toEqual(
      `https://prod-init.100ms.live/init?region=in&peer_id=${peerId}&${userAgentQueryParam}`,
    );
    expect(getUrl('https://prod-init.100ms.live', peerId, userAgent, 'in ')).toEqual(
      `https://prod-init.100ms.live/init?region=in&peer_id=${peerId}&${userAgentQueryParam}`,
    );
    expect(getUrl('https://prod-init.100ms.live', peerId, userAgent, ' i n ')).toEqual(
      `https://prod-init.100ms.live/init?region=i+n&peer_id=${peerId}&${userAgentQueryParam}`,
    );
  });

  it('should return the URL without region if region is not provided or invalid', () => {
    expect(getUrl('https://prod-init.100ms.live', peerId, userAgent, ' ')).toEqual(
      `https://prod-init.100ms.live/init?peer_id=${peerId}&${userAgentQueryParam}`,
    );
    expect(getUrl('https://prod-init.100ms.live', peerId, userAgent, '')).toEqual(
      `https://prod-init.100ms.live/init?peer_id=${peerId}&${userAgentQueryParam}`,
    );
    expect(getUrl('https://prod-init.100ms.live', peerId, userAgent)).toEqual(
      `https://prod-init.100ms.live/init?peer_id=${peerId}&${userAgentQueryParam}`,
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

describe('init API call', () => {
  const peerId = '2e26acc7-d2c8-4235-883e-812695ff1e7d';
  const correctToken =
    'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhY2Nlc3Nfa2V5IjoiNjEwY2Q5Y2JmMzBlNzczZjQ3NTc3YjBkIiwicm9vbV9pZCI6IjYxOGU5NGY1YWYzMTg4ZGYzM2U2N2Q0NiIsInVzZXJfaWQiOiJiZTM5MzQwZC04ZDgzLTQ5ZjQtOTNhMy00ZjRmMTgwZTVkZWUiLCJyb2xlIjoiaG9zdCIsImp0aSI6IjY0ZTRjMTgzLWZkNTktNGE2OS1hOGY2LWNkNGE5MzBmOTYzZSIsInR5cGUiOiJhcHAiLCJ2ZXJzaW9uIjoyLCJleHAiOjE2NTIyNjUyNzV9.t1Wvwl0tXyMzi386LwfDACvUeWibZYIzSf20DTwjqJU';

  // Wrong room ID
  const wrongToken =
    'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhY2Nlc3Nfa2V5IjoiNjEwY2Q5Y2JmMzBlNzczZjQ3NTc3YjBkIiwicm9vbV9pZCI6IjYxOGU5NGY1YWYzMTg4ZGYzM2U2N2Q0NyIsInVzZXJfaWQiOiJiZTM5MzQwZC04ZDgzLTQ5ZjQtOTNhMy00ZjRmMTgwZTVkZWUiLCJyb2xlIjoiaG9zdCIsImp0aSI6IjY0ZTRjMTgzLWZkNTktNGE2OS1hOGY2LWNkNGE5MzBmOTYzZSIsInR5cGUiOiJhcHAiLCJ2ZXJzaW9uIjoyLCJleHAiOjE2NTIyNjUyNzV9.tX4BZllTjOuA5L3bgItoDYKQa6J3d-L2cayvQiEntHY';

  const userAgent = createUserAgent(ENV.PROD);

  const mockResponse = (init: RequestInit | undefined): Promise<Response> => {
    const headers = init?.headers as Record<string, string>;
    const token = headers['Authorization'].split('Bearer ')[1];

    const correctResponse = {
      clone: function () {
        return this;
      },
      json: () =>
        Promise.resolve({
          endpoint: 'wss://prod-in2.100ms.live/v2/ws',
          rtcConfiguration: {
            ice_servers: [
              {
                urls: [
                  'turn:turn-in.100ms.live',
                  'turn:turn-in.100ms.live?transport=tcp',
                  'turn:turn-in.100ms.live:443',
                  'turn:turn-in.100ms.live:443?transport=tcp',
                ],
                username: '1652265276:',
                credential: 'DhPblU64H+I2J6NFSe+nVpl51Vo=',
              },
            ],
          },
          config: {
            networkHealth: {
              scoreMap: { '1': { low: 1, high: 100 } },
              timeout: 10000,
              url: 'https://storage.googleapis.com/100ms-speed-test-download/test1Mb.db',
            },
          },
        }),
      status: 200,
      statusText: '',
    } as unknown as Response;

    const wrongResponse = {
      clone: function () {
        return this;
      },
      json: () =>
        Promise.resolve({
          code: 401,
          message: 'signature is invalid',
        }),
      text: () => Promise.resolve('invalid token'),
      status: 401,
      statusText: '',
    } as unknown as Response;

    if (token === correctToken) {
      return Promise.resolve(correctResponse);
    } else {
      return Promise.resolve(wrongResponse);
    }
  };

  global.fetch = jest.fn((_: RequestInfo, init?: RequestInit) => mockResponse(init)) as jest.Mock;

  it('returns correct config for correct token', async () => {
    const config = await InitService.fetchInitConfig({ token: correctToken, peerId, userAgent });
    expect(config.endpoint).toEqual('wss://prod-in2.100ms.live/v2/ws');
  });

  it('throws INIT exception for wrong token', async () => {
    try {
      await InitService.fetchInitConfig({ token: wrongToken, peerId, userAgent });
    } catch (error: any) {
      expect(error).toBeInstanceOf(HMSException);
      expect(error.name).toEqual('ServerErrors');
      expect(error.isTerminal).toEqual(true);
    }
  });
});
