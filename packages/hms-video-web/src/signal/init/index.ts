import { InitConfig } from './models';
import { ErrorFactory, HMSAction } from '../../error/ErrorFactory';
import HMSLogger from '../../utils/logger';

const TAG = '[InitService]';
export default class InitService {
  private static handleError(response: Response, body: { code: number; message: string }) {
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

  static async fetchInitConfig({
    token,
    peerId,
    userAgent,
    initEndpoint = 'https://prod-init.100ms.live',
    region = '',
  }: {
    token: string;
    peerId: string;
    userAgent: string;
    initEndpoint?: string;
    region?: string;
  }): Promise<InitConfig> {
    HMSLogger.d(TAG, `fetchInitConfig: initEndpoint=${initEndpoint} token=${token} peerId=${peerId} region=${region} `);
    const url = getUrl(initEndpoint, peerId, userAgent, region);
    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const config = await response.json();
      this.handleError(response, config);
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

export function transformInitConfig(config: any): InitConfig {
  let host = process.env.TURN_HOST;
  if (!host) {
    host = "test-turn.100ms.live";
  }

  let list = [ `turn:${host}`,`turn:${host}?transport=tcp`, `turn:${host}:443?transport=tcp`, `turns:${host}:443`]
  
  
  const c =  {
    ...config,
    rtcConfiguration: { 
      ...config.rtcConfiguration, 
      iceServers: config.rtcConfiguration?.ice_servers,
      
    },
  };

  const relayConfig = process.env.ONLY_RELAY
  switch(relayConfig) {
    case "NO_RELAY": 
      delete c.rtcConfiguration.iceServers
      break; 
    case "USE_RELAY":
      c.rtcConfiguration.iceServers[0].urls = list;
      c.rtcConfiguration.iceTransportPolicy = "relay";
      break;
    case "STUN":
      c.rtcConfiguration.iceServers = [{ urls: ["stun:stun.l.google.com:19302"] }];
      break;
  }
  console.log(c.rtcConfiguration)
  return c
}

// export function transformInitConfig(config: any): InitConfig {
//   let host = "test-turn.100ms.live"
//   let list = [ `turn:${host}`,`turn:${host}?transport=tcp`, `turn:${host}:443?transport=tcp`, `turns:${host}:443`]
//   const iceServers = []
  
//   for (let url of list) {
//     let server = { ...config.rtcConfiguration?.ice_servers[0], urls: [url] }
//     iceServers.push(server)
//   }

//   const c =  {
//     ...config,
//     rtcConfiguration: { 
//       ...config.rtcConfiguration,
//       iceServers,
//       iceTransportPolicy: process.env.ONLY_RELAY == "true" ? "relay" : "all"
//     },
//   };

//   console.log(c)
//   return c
// }