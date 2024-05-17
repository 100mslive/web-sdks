import { HMSICEServer } from '../interfaces';

export const transformIceServerConfig = (defaultConfig?: RTCIceServer[], iceServers?: HMSICEServer[]) => {
  if (!iceServers || iceServers.length === 0) {
    return defaultConfig;
  }
  const transformedIceServers = iceServers.map(server => {
    return { urls: server.urls, credentialType: 'password', credential: server.password, username: server.userName };
  });
  return transformedIceServers;
};
