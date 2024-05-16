import { HMSProxyConfig } from '../interfaces';

export const getEndpointFromProxy = (proxy?: HMSProxyConfig) => {
  if (!proxy) {
    return '';
  }
  let endpoint = `://${proxy.host}:${proxy.port}`;
  switch (proxy.type) {
    case 0:
      endpoint = `https${endpoint}`;
      break;
    default:
      endpoint = `https${endpoint}`;
  }
  return endpoint;
};
