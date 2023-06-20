import {
  HMSPollQuestion,
  HMSPollQuestionAnswer,
  HMSPollQuestionOption,
  HMSPollQuestionResponse,
  HMSPollState,
} from '../../interfaces';

export interface PollInfoParams {
  poll_id: string; // unique poll id, optional, if not provided server will create one
  title: string; // title for poll
  type?: 'poll' | 'quiz'; //type = quiz or poll
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
