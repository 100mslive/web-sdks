export interface HMSNotification {
  id: number;
  type: string;
  message: string;
  data: any;
  severity?: HMSSeverity;
}
export class HMSNoticiationSeverity {
  static INFO = 'info';
  static ERROR = 'error';
  static CRITICAL = 'critical';
}

export type HMSSeverity = 'info' | 'error' | 'critical';

export class HMSNotificationTypes {
  static PEER_JOINED = 'PEER_JOINED';
  static PEER_LEFT = 'PEER_LEFT';
  static NEW_MESSAGE = 'NEW_MESSAGE';
  static ERROR = 'ERROR';
  static RECONNECTING = 'RECONNECTING';
  static RECONNECTED = 'RECONNECTED';
  static TRACK_ADDED = 'TRACK_ADDED';
  static TRACK_REMOVED = 'TRACK_REMOVED';
  static TRACK_MUTED = 'TRACK_MUTED';
  static TRACK_UNMUTED = 'TRACK_UNMUTED';
  static ROLE_CHANGE_REQUEST = 'ROLE_CHANGE_REQUEST';
}
