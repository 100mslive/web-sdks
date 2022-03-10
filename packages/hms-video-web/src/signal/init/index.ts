import { InitConfig } from './models';
import HMSLogger from '../../utils/logger';
import { userAgent } from '../../utils/support';
import { ErrorFactory, HMSAction } from '../../error/ErrorFactory';

const TAG = 'InitService';

export default class InitService {
  private static async handleError(response: Response) {
    const body = await response.json();
    switch (response.status) {
      case 404:
        throw ErrorFactory.InitAPIErrors.EndpointUnreachable(HMSAction.INIT, body.message || response.statusText);
      case 200:
        break;
      default:
        throw ErrorFactory.InitAPIErrors.ServerErrors(
          body.code || response.status,
          HMSAction.INIT,
          body.message || response?.statusText,
        );
    }
  }

  static async fetchInitConfig(
    token: string,
    peerId: string,
    initEndpoint = 'https://prod-init.100ms.live',
    region = '',
  ): Promise<InitConfig> {
    HMSLogger.d(TAG, `fetchInitConfig: initEndpoint=${initEndpoint} token=${token} peerId=${peerId} region=${region} `);
    const url = getUrl(initEndpoint, peerId, region);
    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const config = await response.json();
      this.handleError(response);
      HMSLogger.d(TAG, `config is ${JSON.stringify(config, null, 2)}`);
      return transformInitConfig(config);
    } catch (err) {
      const error = err as Error;
      if (['Failed to fetch', 'NetworkError'].some(message => error.message.includes(message))) {
        throw ErrorFactory.InitAPIErrors.EndpointUnreachable(HMSAction.INIT, error.message);
      }
      throw error;
    }
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
