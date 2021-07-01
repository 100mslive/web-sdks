import { InitConfig } from './models';
import HMSLogger from '../../utils/logger';
import { userAgent } from '../../utils/support';
import { ErrorFactory, HMSAction } from '../../error/ErrorFactory';

const TAG = 'InitService';

export default class InitService {
  static async fetchInitConfig(
    token: string,
    initEndpoint: string = 'https://prod-init.100ms.live',
    region: string = '',
  ): Promise<InitConfig> {
    HMSLogger.d(TAG, `fetchInitConfig: initEndpoint=${initEndpoint} token=${token} region=${region}`);
    const url = getUrl(initEndpoint, region);
    let response, config;
    try {
      response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.status === 404) {
        throw ErrorFactory.InitAPIErrors.EndpointUnreachable(HMSAction.INIT, response.statusText);
      }
      if (response.status === 401) {
        throw ErrorFactory.InitAPIErrors.InvalidTokenFormat(HMSAction.INIT, response.statusText);
      }
      if (response?.status !== 200) {
        throw ErrorFactory.InitAPIErrors.HTTPError(response.status, HMSAction.INIT, response?.statusText);
      }
      config = await response?.json();
      HMSLogger.d(TAG, `config is ${JSON.stringify(config, null, 2)}`);
    } catch (error) {
      if (error.message === 'Failed to fetch') {
        throw ErrorFactory.InitAPIErrors.ConnectionLost(HMSAction.INIT, error.message);
      }
      throw ErrorFactory.GenericErrors.JsonParsingFailed(HMSAction.INIT, error.message);
    }
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
