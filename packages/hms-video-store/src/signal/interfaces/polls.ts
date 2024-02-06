import {
  HMSPollQuestion,
  HMSPollQuestionAnswer,
  HMSPollQuestionOption,
  HMSPollQuestionResponse,
  HMSPollQuestionType,
  HMSPollState,
} from '../../interfaces';

export interface PollInfoParams {
  poll_id: string; // unique poll id, optional, if not provided server will create one
  title: string; // title for poll
  type: 'poll' | 'quiz'; //type = quiz or poll
  duration?: number; // number of second for which poll is active after start, 0 means poll can only be stopped by command or session end
  anonymous?: boolean; // poll is anonymous, peer id or user id is not stored, default: false
  visibility?: boolean; // default is false
  locked?: boolean; // default is false
  mode?: string; // polling mode, userid, peerid, username, default: userid
  vote?: string[]; // list of roles who can vote, default: null
  responses?: string[]; // list of roles who can itreate over all responses. default: null
  state?: HMSPollState;
  created_by?: string;
  started_by?: string;
  stopped_by?: string;
  created_at?: number;
  started_at?: number;
  stopped_at?: number;
  questions_count?: number;
}

export interface PollID {
  poll_id: string;
}

export type PollInfoSetParams = PollInfoParams;
export type PollInfoSetResponse = PollID;

export type PollInfoGetParams = PollID;
export type PollInfoGetResponse = PollInfoParams;

export type PollStartParams = PollID;
export type PollStopParams = PollID;

export interface PollStartResponse extends PollID {
  duration: number;
}

export type PollStopResponse = PollStartResponse;

export interface PollQuestionInfoParams
  extends Omit<HMSPollQuestion, 'options' | 'answer' | 'responses' | 'answerMinLen' | 'answerMaxLen'> {
  answer_min_len?: number;
  answer_max_len?: number;
}

export interface PollQuestionParams {
  question: PollQuestionInfoParams;
  options?: HMSPollQuestionOption[];
  answer?: HMSPollQuestionAnswer;
  weight?: number;
}

export interface PollQuestionsSetParams {
  poll_id: string;
  questions: PollQuestionParams[];
}

export interface PollQuestionsSetResponse extends PollID {
  total_questions: number;
}

export interface PollQuestionsGetParams {
  poll_id: string;
  index: number;
  count: number;
}

export interface PollQuestionsGetResponse extends PollQuestionsSetParams {
  last: boolean;
}

export interface PollResponseParams
  extends Pick<HMSPollQuestionResponse, 'type' | 'skipped' | 'option' | 'options' | 'text' | 'update' | 'duration'> {
  question: number;
}

export interface PollResponseSetParams {
  poll_id: string;
  responses: PollResponseParams[];
}

export interface PollResponseSetResponse {
  poll_id: string;
  result: {
    question: number;
    correct: boolean;
    error: {
      code: number;
      message: string;
      description: string;
    };
  }[];
}

export interface PollListParams {
  state?: HMSPollState;
  count?: number;
  start?: string;
}

export interface PollListResponse {
  last: string;
  polls: PollInfoParams[];
}

export interface PollResponsesGetParams {
  poll_id: string;
  index: number;
  count: number;
  self: boolean;
}

interface PollResponse
  extends Pick<HMSPollQuestionResponse, 'type' | 'skipped' | 'option' | 'options' | 'text' | 'update'> {
  question: number;
  response_id: string;
}

export interface PollResponsePeerInfo {
  hash: string;
  peerid: string;
  userid: string;
  username: string;
}

export interface PollResponsesGetResponse {
  poll_id: string;
  last?: boolean;
  responses?: {
    final?: boolean;
    response: PollResponse;
    peer: PollResponsePeerInfo;
  }[];
}

export interface PollResult {
  max_user: number;
  total_response: number;
  user_count: number;
  questions?: {
    question: number;
    type: HMSPollQuestionType;
    options?: number[];
    correct?: number;
    skipped?: number;
    total?: number;
  }[];
}

export type PollResultParams = PollID;

export type PollResultResponse = PollResult & PollID;

export interface PollLeaderboardGetParams {
  poll_id: string;
  question?: number; // Question index
  count?: number; // Number of peers to be included, sorted by duration in ascending order. Default: 10
  offset: number; // Position to start (response is paginated)
}

export interface PollLeaderboardEntry {
  position: number; // leaderboard position
  score: number; // sum of weights of correct answers
  total_responses: number;
  correct_responses: number;
  duration: number; // sum of ms to answer correct questions
  peer: PollResponsePeerInfo;
}

export interface PollLeaderboardGetResponse {
  poll_id: string;
  total_users: number;
  voted_users: number;
  correct_users: number;
  avg_time: number;
  avg_score: number;
  questions: PollLeaderboardEntry[];
  last: boolean;
}
