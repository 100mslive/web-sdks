export interface HMSNotification {
  id: number;
  type: string;
  message: string;
  /**
   * HMSPeer | HMSTrack | HMSMessage | HMSException
   */
  data?: any;
  severity?: HMSNotificationSeverity;
}
export enum HMSNotificationSeverity {
  INFO = 'info',
  ERROR = 'error',
  CRITICAL = 'critical',
}

export enum HMSNotificationTypes {
  PEER_JOINED = 'PEER_JOINED',
  PEER_LEFT = 'PEER_LEFT',
  NEW_MESSAGE = 'NEW_MESSAGE',
  ERROR = 'ERROR',
  RECONNECTING = 'RECONNECTING',
  RECONNECTED = 'RECONNECTED',
  TRACK_ADDED = 'TRACK_ADDED',
  TRACK_REMOVED = 'TRACK_REMOVED',
  TRACK_MUTED = 'TRACK_MUTED',
  TRACK_UNMUTED = 'TRACK_UNMUTED',
  ROLE_CHANGE_REQUEST = 'ROLE_CHANGE_REQUEST',
  ROLE_UPDATED = 'ROLE_UPDATED',
}
