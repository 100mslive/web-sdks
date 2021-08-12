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
  POLICY_CHANGE,
  ROLE_CHANGE_REQUEST,
  TRACK_UPDATE_REQUEST,
  PEER_UPDATE,
  PEER_LEAVE_REQUEST,
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
    case 'on-policy-change':
      return HMSNotificationMethod.POLICY_CHANGE;
    case 'on-role-change-request':
      return HMSNotificationMethod.ROLE_CHANGE_REQUEST;
    case 'on-track-update-request':
      return HMSNotificationMethod.TRACK_UPDATE_REQUEST;
    case 'on-peer-leave-request':
      return HMSNotificationMethod.PEER_LEAVE_REQUEST;
    case 'on-peer-update':
      return HMSNotificationMethod.PEER_UPDATE;
    default:
      HMSLogger.d(`method not supported - ${method}`);
      return HMSNotificationMethod.UNSUPPORTED;
  }
};
