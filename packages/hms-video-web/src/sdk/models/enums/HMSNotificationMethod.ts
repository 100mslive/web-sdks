import HMSLogger from '../../../utils/logger';

export enum HMSNotificationMethod {
  PEER_JOIN,
  PEER_LEAVE,
  PEER_LIST,
  ACTIVE_SPEAKERS,
  BROADCAST,
  ROLE_CHANGE,
  TRACK_METADATA_ADD,
  TRACK_UPDATE,
  UNSUPPORTED,
}

export const getNotificationMethod = (method: string) => {
  switch (method) {
    case 'on-peer-join':
      return HMSNotificationMethod.PEER_JOIN;
    case 'on-peer-leave':
      return HMSNotificationMethod.PEER_LEAVE;
    case 'peer-list':
      return HMSNotificationMethod.PEER_LIST;
    case 'on-track-add':
      return HMSNotificationMethod.TRACK_METADATA_ADD;
    case 'on-track-update':
      return HMSNotificationMethod.TRACK_UPDATE;
    case 'active-speakers':
      return HMSNotificationMethod.ACTIVE_SPEAKERS;
    case 'on-broadcast':
      return HMSNotificationMethod.BROADCAST;
    case 'on-role-change':
      return HMSNotificationMethod.ROLE_CHANGE;
    default:
      HMSLogger.d(`method not supported - ${method}`);
      return HMSNotificationMethod.UNSUPPORTED;
  }
};
