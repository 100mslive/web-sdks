import { HMSProxyConfig } from '../interfaces';

export const getEndpointFromProxy = (proxy?: HMSProxyConfig) => {
  if (!proxy) {
    return '';
  }
  return `https://${proxy.host}:${proxy.port}`;
};
