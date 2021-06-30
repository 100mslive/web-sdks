import { InitConfig } from './models';
import HMSLogger from '../../utils/logger';
import { userAgent } from '../../utils/support';

const TAG = 'InitService';
const MAX_TRIES = 3;

export default class InitService {
  static async fetchInitConfigWithRetry(
    token: string,
    initEndpoint: string = 'https://prod-init.100ms.live',
    region: string = '',
  ): Promise<InitConfig> {
    let initError: string = 'init api failed';
    for (let i = 1; i <= MAX_TRIES; i++) {
      try {
        return await InitService.fetchInitConfig(token, initEndpoint, region);
      } catch (err) {
        HMSLogger.e(TAG, 'init: failed init api - ', err);
        initError = err;
      }
    }
    throw initError;
  }

  private static async fetchInitConfig(token: string, initEndpoint: string, region: string = ''): Promise<InitConfig> {
    HMSLogger.d(TAG, `fetchInitConfig: initEndpoint=${initEndpoint} token=${token} region=${region}`);
    const url = getUrl(initEndpoint, region);

    // @TODO: Add user-agent, handle error status codes
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const config = await response.json();
    HMSLogger.d(TAG, `config is ${JSON.stringify(config, null, 2)}`);
    return transformInitConfig(config);
  }
}

export function getUrl(endpoint: string, region?: string) {
  try {
    const url = new URL('/init', endpoint);

    if (region && region.trim().length > 0) {
      url.searchParams.set('region', region.trim());
    }
    url.searchParams.set('user_agent', userAgent);
    return url.toString();
  } catch (error) {
    console.log(error.name, error.message);
    throw error;
  }
}

export function transformInitConfig(config: any): InitConfig {
  return {
    ...config,
    rtcConfiguration: { ...config.rtcConfiguration, iceServers: config.rtcConfiguration.ice_servers },
  };
}
