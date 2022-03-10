// @ts-nocheck
import { isBrowser } from './support';

export const getNetworkInfo = () => {
  if (!isBrowser) {
    return;
  }

  try {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const networkInfo = {
      downlink: connection.downlink,
      downlinkMax: connection.downlinkMax,
      effectiveType: connection.effectiveType,
      rtt: connection.rtt,
      saveData: connection.saveData,
      type: connection.type,
    };
    return networkInfo;
  } catch (error) {}
};
