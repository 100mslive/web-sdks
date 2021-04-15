export enum HMSNotificationMethod {
  PEER_JOIN,
  PEER_LEAVE,
  PEER_LIST,
  STREAM_ADD,
  ACTIVE_SPEAKERS,
}

export const getNotificationMethod = (method: string) => {
  switch (method) {
    case 'peer-join':
      return HMSNotificationMethod.PEER_JOIN;
      break;
    case 'peer-leave':
      return HMSNotificationMethod.PEER_LEAVE;
      break;
    case 'peer-list':
      return HMSNotificationMethod.PEER_LIST;
      break;
    case 'stream-add':
      return HMSNotificationMethod.STREAM_ADD;
      break;
    case 'active-speakers':
      return HMSNotificationMethod.ACTIVE_SPEAKERS;
      break;
    default:
      throw Error(`Unsupported method=${method} received`);
  }
};
