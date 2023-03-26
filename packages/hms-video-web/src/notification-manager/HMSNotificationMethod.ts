/**
 * Method names for incoming RPC messages from BIZ Signal through Websocket.
 * Used to call the corresponding handler/manager in NotificationManager
 * which will call the corresponding HMSUpdateListener callbacks.
 */

export enum HMSNotificationMethod {
  ROOM_STATE = 'room-state',
  PEER_JOIN = 'on-peer-join',
  PEER_LEAVE = 'on-peer-leave',
  PEER_LIST = 'peer-list',
  TRACK_METADATA_ADD = 'on-track-add',
  TRACK_UPDATE = 'on-track-update',
  CHANGE_TRACK_MUTE_STATE_UPDATE = 'on-change-track-mute-state-request',
  ACTIVE_SPEAKERS = 'active-speakers',
  CONNECTION_QUALITY = 'on-connection-quality-update',
  SFU_STATS = 'sfu-stats',
  ON_SFU_TRACK_LAYER_UPDATE = 'on-track-layer-update',
  BROADCAST = 'on-broadcast',
  ROLE_CHANGE = 'on-role-change',
  POLICY_CHANGE = 'on-policy-change',
  ROLE_CHANGE_REQUEST = 'on-role-change-request',
  TRACK_UPDATE_REQUEST = 'on-track-update-request',
  PEER_UPDATE = 'on-peer-update',
  PEER_LEAVE_REQUEST = 'on-peer-leave-request',
  UNSUPPORTED = 'unsupported',
  RTMP_START = 'on-rtmp-start',
  RTMP_STOP = 'on-rtmp-stop',
  RECORDING_START = 'on-record-start',
  RECORDING_STOP = 'on-record-stop',
  HLS_START = 'on-hls-start',
  HLS_STOP = 'on-hls-stop',
  METADATA_CHANGE = 'on-metadata-change',
}
