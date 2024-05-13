import { HMSICEServer } from '../interfaces';

export const transformIceServerConfig = (iceServers?: HMSICEServer[]) => {
  if (!iceServers) {
    return null;
  }
  const transformedIceServers = iceServers.map(server => {
    return { urls: server.urls, credentialType: 'password', credential: server.password, username: server.userName };
  });
  return transformedIceServers;
};
