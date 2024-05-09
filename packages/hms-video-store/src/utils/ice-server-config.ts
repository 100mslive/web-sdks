import { HMSICEServer } from '../interfaces';

export const transformIceServerConfig = (iceServers?: HMSICEServer[]) => {
  if (!iceServers) {
    return null;
  }
  const transformedIceServers = iceServers.map(server => {
    return { urls: server.urls, credentialType: 'password', credential: server.password, userName: server.userName };
  });
  return transformedIceServers;
};
