import { HMSAction } from '../../error/ErrorFactory';

export interface JsonRpcRequest {
  id: string;
  method: string;
  params: Map<string, any>;
}

export interface JsonRpcResponse {
  id: string;
  result: any;
  error: {
    code: number;
    message: string;
  };
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
  END_ROOM = 'end-room',
  PING = 'ping',
  ROLE_CHANGE_REQUEST = 'role-change-request',
  ROLE_CHANGE = 'role-change',
  TRACK_UPDATE_REQUEST = 'track-update-request',
  PEER_LEAVE_REQUEST = 'peer-leave-request',
  START_RTMP_OR_RECORDING_REQUEST = 'rtmp-start',
  STOP_RTMP_AND_RECORDING_REQUEST = 'rtmp-stop',
}

export function convertSignalMethodtoErrorAction(method: HMSSignalMethod): HMSAction {
  switch (method) {
    case HMSSignalMethod.JOIN:
      return HMSAction.JOIN;
    case HMSSignalMethod.OFFER:
      return HMSAction.PUBLISH;
    case HMSSignalMethod.ANSWER:
      return HMSAction.SUBSCRIBE;
    case HMSSignalMethod.TRACK_UPDATE:
      return HMSAction.TRACK;
    default:
      return HMSAction.NONE;
  }
}
