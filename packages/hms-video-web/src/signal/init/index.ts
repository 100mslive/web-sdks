import { InitConfig } from './models';
import HMSLogger from '../../utils/logger';
import { userAgent } from '../../utils/support';
import { ErrorFactory, HMSAction } from '../../error/ErrorFactory';

const TAG = 'InitService';

export default class InitService {
  static async fetchInitConfig(
    token: string,
    peerId: string,
    initEndpoint = 'https://prod-init.100ms.live',
    region = '',
  ): Promise<InitConfig> {
    HMSLogger.d(TAG, `fetchInitConfig: initEndpoint=${initEndpoint} token=${token} peerId=${peerId} region=${region} `);
    const url = getUrl(initEndpoint, peerId, region);
    let response, config;
    try {
      response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const body = await response.json();
      if (response.status === 404) {
        throw ErrorFactory.InitAPIErrors.EndpointUnreachable(HMSAction.INIT, body.message || response.statusText);
      }
      if (response?.status !== 200) {
        throw ErrorFactory.InitAPIErrors.ServerErrors(
          body.code || response.status,
          HMSAction.INIT,
          body.message || response?.statusText,
        );
      }
      config = body;
      HMSLogger.d(TAG, `config is ${JSON.stringify(config, null, 2)}`);
    } catch (err) {
      const error = err as Error;
      if (error.message === 'Failed to fetch' || error.message.includes('NetworkError')) {
        throw ErrorFactory.InitAPIErrors.ConnectionLost(HMSAction.INIT, error.message);
      }
      throw error;
    }
    return transformInitConfig(config);
  }
}

export function getUrl(endpoint: string, peerId: string, region?: string) {
  try {
    const url = new URL('/init', endpoint);

    if (region && region.trim().length > 0) {
      url.searchParams.set('region', region.trim());
    }
    url.searchParams.set('peer_id', peerId);
    url.searchParams.set('user_agent', userAgent);
    return url.toString();
  } catch (err) {
    const error = err as Error;
    HMSLogger.e(TAG, error.name, error.message);
    throw error;
  }
}

export function transformInitConfig(config: any): InitConfig {
  return {
    ...config,
    rtcConfiguration: { ...config.rtcConfiguration, iceServers: config.rtcConfiguration.ice_servers },
  };
}
