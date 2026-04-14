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
  TRACK_REMOVE = 'on-track-remove',
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
  RTMP_UPDATE = 'on-rtmp-update',
  RECORDING_UPDATE = 'on-record-update',
  HLS_UPDATE = 'on-hls-update',
  TRANSCRIPTION_UPDATE = 'on-transcription-update',
  METADATA_CHANGE = 'on-metadata-change',
  POLL_START = 'on-poll-start',
  POLL_STOP = 'on-poll-stop',
  POLL_STATS = 'on-poll-stats',
  ROOM_INFO = 'room-info',
  SESSION_INFO = 'session-info',
  NODE_INFO = 'node-info',
  WHITEBOARD_UPDATE = 'on-whiteboard-update',
}
