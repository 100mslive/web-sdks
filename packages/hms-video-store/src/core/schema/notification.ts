export interface HMSNotification {
  id: number;
  type: string;
  message: string;
  data: any;
  severity?: 'info' | 'error' | 'critical';
}

export class HMSNotificationTypes {
  static PEER_JOINED = 'PEER_JOINED';
  static PEER_LEFT = 'PEER_LEFT';
  static NEW_MESSAGE = 'NEW_MESSAGE';
  static ERROR = 'ERROR';
}
