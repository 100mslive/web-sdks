export interface JsonRpcRequest {
  id: string;
  method: string;
  params: Map<string, any>;
}

export enum HMSSignalMethod {
  JOIN = 'join',
  OFFER = 'offer',
  ANSWER = 'answer',
  TRICKLE = 'trickle',
  TRACK_UPDATE = 'track-update',
  BROADCAST = 'broadcast',
  ANALYTICS = 'analytics',
  SERVER_ERROR = 'on-error',
  SDK_NOTIFICATION = 'sdk-notification',
  LEAVE = 'leave',
  PING = 'ping',
}
