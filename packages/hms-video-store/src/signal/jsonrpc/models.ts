import { HMSAction } from '../../error/HMSAction';

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
  SERVER_WARNING = 'on-warning',
  SDK_NOTIFICATION = 'sdk-notification',
  LEAVE = 'leave',
  END_ROOM = 'end-room',
  PING = 'ping',
  ROLE_CHANGE_REQUEST = 'role-change-request',
  ROLE_CHANGE = 'role-change',
  TRACK_UPDATE_REQUEST = 'track-update-request',
  PEER_LEAVE_REQUEST = 'peer-leave-request',
  CHANGE_TRACK_MUTE_STATE_REQUEST = 'change-track-mute-state-request',
  START_RTMP_OR_RECORDING_REQUEST = 'rtmp-start',
  STOP_RTMP_AND_RECORDING_REQUEST = 'rtmp-stop',
  UPDATE_PEER_METADATA = 'peer-update',
  START_HLS_STREAMING = 'hls-start',
  STOP_HLS_STREAMING = 'hls-stop',
  START_TRANSCRIPTION = 'transcription-start',
  STOP_TRANSCRIPTION = 'transcription-stop',
  HLS_TIMED_METADATA = 'hls-timed-metadata',
  SET_METADATA = 'set-metadata',
  GET_METADATA = 'get-metadata',
  LISTEN_METADATA_CHANGE = 'listen-metadata-change',
  POLL_INFO_SET = 'poll-info-set',
  POLL_INFO_GET = 'poll-info-get',
  POLL_QUESTIONS_SET = 'poll-questions-set',
  POLL_QUESTIONS_GET = 'poll-questions-get',
  POLL_START = 'poll-start',
  POLL_STOP = 'poll-stop',
  POLL_RESPONSE_SET = 'poll-response',
  POLL_LIST = 'poll-list',
  POLL_RESPONSES = 'poll-responses',
  POLL_RESULT = 'poll-result',
  POLL_LEADERBOARD = 'poll-leaderboard',
  GET_PEER = 'get-peer',
  FIND_PEER = 'find-peer',
  SEARCH_BY_NAME = 'peer-name-search',
  PEER_ITER_NEXT = 'peer-iter-next',
  GROUP_JOIN = 'group-join',
  GROUP_LEAVE = 'group-leave',
  GROUP_ADD = 'group-add',
  GROUP_REMOVE = 'group-remove',
  WHITEBOARD_CREATE = 'whiteboard-create',
  WHITEBOARD_GET = 'whiteboard-get',
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
