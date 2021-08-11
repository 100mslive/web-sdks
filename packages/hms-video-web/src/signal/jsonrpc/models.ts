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
  ROLE_CHANGE_REQUEST = 'role-change-request',
  ROLE_CHANGE = 'role-change',
  TRACK_UPDATE_REQUEST = 'track-update-request',
}
