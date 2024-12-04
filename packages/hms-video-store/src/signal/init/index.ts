import { InitConfig } from './models';
import { ErrorFactory } from '../../error/ErrorFactory';
import { HMSAction } from '../../error/HMSAction';
import { HMSICEServer } from '../../interfaces';
import { HMSException } from '../../internal';
import { transformIceServerConfig } from '../../utils/ice-server-config';
import HMSLogger from '../../utils/logger';

const TAG = '[InitService]';
export default class InitService {
  private static handleError(response: Response, body: { code: number; message: string }) {
    switch (response.status) {
      case 404:
        throw ErrorFactory.APIErrors.EndpointUnreachable(HMSAction.INIT, body.message || response.statusText);
      case 200:
        break;
      default:
        throw ErrorFactory.APIErrors.ServerErrors(
          body.code || response.status,
          HMSAction.INIT,
          body.message || response?.statusText,
        );
    }
  }

  static async fetchInitConfig({
    token,
    peerId,
    userAgent,
    initEndpoint = 'https://prod-init.100ms.live',
    region = '',
    iceServers,
  }: {
    token: string;
    peerId: string;
    userAgent: string;
    initEndpoint?: string;
    region?: string;
    iceServers?: HMSICEServer[];
  }): Promise<InitConfig> {
    HMSLogger.d(TAG, `fetchInitConfig: initEndpoint=${initEndpoint} token=${token} peerId=${peerId} region=${region} `);
    const url = getUrl(initEndpoint, peerId, userAgent, region);
    try {
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      try {
        const config = await response.clone().json();
        this.handleError(response, config);
        HMSLogger.d(TAG, `config is ${JSON.stringify(config, null, 2)}`);
        return transformInitConfig(config, iceServers);
      } catch (err) {
        const text = await response.text();
        HMSLogger.e(TAG, 'json error', (err as Error).message, text);
        throw err instanceof HMSException
          ? err
          : ErrorFactory.APIErrors.ServerErrors(response.status, HMSAction.INIT, (err as Error).message);
      }
    } catch (err) {
      const error = err as Error;
      if (['Failed to fetch', 'NetworkError', 'ECONNRESET'].some(message => error.message.includes(message))) {
        throw ErrorFactory.APIErrors.EndpointUnreachable(HMSAction.INIT, error.message);
      }
      throw error;
    }
  }
}

export function getUrl(endpoint: string, peerId: string, userAgent: string, region?: string) {
  try {
    const url = new URL('/init', endpoint);

    if (region && region.trim().length > 0) {
      url.searchParams.set('region', region.trim());
    }
    url.searchParams.set('peer_id', peerId);
    url.searchParams.set('user_agent_v2', userAgent);
    return url.toString();
  } catch (err) {
    const error = err as Error;
    HMSLogger.e(TAG, error.name, error.message);
    throw error;
  }
}

export function transformInitConfig(config: any, iceServers?: HMSICEServer[]): InitConfig {
  return {
    ...config,
    rtcConfiguration: {
      ...config.rtcConfiguration,
      iceServers: transformIceServerConfig(config.rtcConfiguration?.ice_servers, iceServers),
    },
  };
}
