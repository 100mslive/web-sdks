/**
 * Method names for incoming RPC messages from BIZ Signal through Websocket.
 * Used to call the corresponding handler/manager in NotificationManager
 * which will call the corresponding HMSUpdateListener callbacks.
 */

export enum HMSNotificationMethod {
  PEER_JOIN = 'on-peer-join',
  PEER_LEAVE = 'on-peer-leave',
  PEER_LIST = 'peer-list',
  TRACK_METADATA_ADD = 'on-track-add',
  TRACK_UPDATE = 'on-track-update',
  ACTIVE_SPEAKERS = 'active-speakers',
  BROADCAST = 'on-broadcast',
  ROLE_CHANGE = 'on-role-change',
  POLICY_CHANGE = 'on-policy-change',
  ROLE_CHANGE_REQUEST = 'on-role-change-request',
  TRACK_UPDATE_REQUEST = 'on-track-update-request',
  PEER_UPDATE = 'on-peer-update',
  PEER_LEAVE_REQUEST = 'on-peer-leave-request',
  UNSUPPORTED = 'unsupported',
}
