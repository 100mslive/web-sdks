export enum HMSNotificationMethod {
  PEER_JOIN,
  PEER_LEAVE,
  PEER_LIST,
  STREAM_ADD,
  ACTIVE_SPEAKERS,
  BROADCAST,
  ROLE_CHANGE,
  TRACK_ADD,
}

export const getNotificationMethod = (method: string) => {
  switch (method) {
    case 'on-peer-join':
      return HMSNotificationMethod.PEER_JOIN;
    case 'on-peer-leave':
      return HMSNotificationMethod.PEER_LEAVE;
    case 'peer-list':
      return HMSNotificationMethod.PEER_LIST;
    case 'stream-add':
      return HMSNotificationMethod.STREAM_ADD;
    case 'on-track-add':
      return HMSNotificationMethod.TRACK_ADD;
    case 'active-speakers':
      return HMSNotificationMethod.ACTIVE_SPEAKERS;
    case 'on-broadcast':
      return HMSNotificationMethod.BROADCAST;
    case 'on-role-change':
      return HMSNotificationMethod.ROLE_CHANGE;
    default:
      throw Error(`Unsupported method=${method} received`);
  }
};
