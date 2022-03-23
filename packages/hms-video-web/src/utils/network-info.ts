// @ts-nocheck
import { isBrowser } from './support';

export const getNetworkInfo = () => {
  if (!isBrowser || typeof navigator.connection === 'undefined') {
    return;
  }

  const connection = navigator.connection;
  const networkInfo = {
    downlink: connection.downlink,
    downlinkMax: connection.downlinkMax,
    effectiveType: connection.effectiveType,
    rtt: connection.rtt,
    saveData: connection.saveData,
    type: connection.type,
  };
  return networkInfo;
};
