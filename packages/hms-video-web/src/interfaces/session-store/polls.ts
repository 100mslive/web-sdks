import { HMSRoleName } from '../role';

export type HMSPollUserTrackingMode = 'peerID' | 'customerID' | 'userName';

// MARK: - Poll
export interface HMSPoll {
  id: string;
  title: string;
  state?: 'started' | 'stopped' | 'created';
  type?: 'poll' | 'quiz';
  duration?: number;
  anonymous?: boolean;
  visibility?: boolean;
  locked?: boolean;
  mode?: HMSPollUserTrackingMode;
  createdBy?: string;
  startedBy?: string;
  stoppedBy?: string;
  createdAt?: Date;
  startedAt?: Date;
  stoppedAt?: Date;
  questions?: HMSPollQuestion[];
  rolesThatCanVote?: HMSRoleName[];
  rolesThaCanViewResponses?: HMSRoleName[];
}

export interface HMSPollCreateParams
  extends Pick<
    HMSPoll,
    | 'id'
    | 'title'
    | 'type'
    | 'duration'
    | 'anonymous'
    | 'visibility'
    | 'locked'
    | 'mode'
    | 'rolesThatCanVote'
    | 'rolesThaCanViewResponses'
  > {
  questions?: HMSPollQuestionCreateParams[];
}

// MARK: - Question
export interface HMSPollQuestion {
  index: number;
  text: string;
  type: HMSPollQuestionType;
  skippable?: boolean;
  duration?: number;
  once?: boolean;
  weight?: number;
  negative?: boolean;
  answerMinLen?: number;
  answerMaxLen?: number;
  options?: HMSPollQuestionOption[];
  answer?: HMSPollQuestionAnswer;
  responses?: HMSPollQuestionResponse[];
}

export interface HMSPollQuestionCreateParams extends Pick<HMSPollQuestion, 'text' | 'skippable' | 'type' | 'answer'> {
  index?: number;
  options?: HMSPollQuestionOptionCreateParams[];
}

export interface HMSPollQuestionAnswer {
  hidden: boolean; // if true answer will not be returned when poll is running
  option?: number; // option index for correct answer, in case of single choice
  options?: number[]; // list of options that shoould be in answer
  text?: string; // answer text for answer.
  case?: boolean; // if false case is ignored when comparing.
  trim?: boolean; // if true, empty space is trimmer from start and end of asnwer.
}

export enum HMSPollQuestionType {
  SINGLE_CHOICE = 'single-choice',
  MULTI_CHOICE = 'multi-choice',
  SHORT_ANSWER = 'short-answer',
  LONG_ANSWER = 'long-answer',
}

// MARK: - Choice
export interface HMSPollQuestionOption {
  index: number;
  text: string;
  weight?: number;
  voteCount?: number;
}

export interface HMSPollQuestionOptionCreateParams extends Pick<HMSPollQuestionOption, 'text' | 'weight'> {
  isCorrectAnswer?: boolean;
}

export interface HMSPollQuestionResponse {
  questionIndex: number;
  peer?: HMSPollResponsePeerInfo;
  type?: HMSPollQuestionType; // private property
  skipped?: boolean;
  option?: number;
  options?: [number];
  text?: string;
  update?: boolean; // SDK Needs to track wether we previously answered and set accordingly
  duration?: number; // Time it took to answer the question for leaderboard
  responseFinal?: boolean; // Indicates wether this is last update when fetching responses
}

export type HMSPollQuestionResponseCreateParams = Omit<
  HMSPollQuestionResponse,
  'type' | 'peer' | 'update' | 'responseFinal'
>;

interface HMSPollResponsePeerInfo {
  userHash?: string;
  peerid?: string;
  userid?: string;
  username?: string;
}
