import { HMSRoleName } from '../role';

export type HMSPollUserTrackingMode = 'peerID' | 'customerID' | 'userName';

export type HMSPollState = 'created' | 'started' | 'stopped';

export interface HMSPoll {
  id: string;
  title: string;
  state?: HMSPollState;
  type: 'poll' | 'quiz';
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
  rolesThatCanViewResponses?: HMSRoleName[];
  result?: HMSPollResult;
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
    | 'rolesThatCanViewResponses'
  > {
  questions?: HMSPollQuestionCreateParams[];
}

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
  result?: HMSPollQuestionResult;
}

export interface HMSPollQuestionCreateParams extends Pick<HMSPollQuestion, 'text' | 'skippable' | 'type' | 'answer'> {
  index?: number;
  options?: HMSPollQuestionOptionCreateParams[];
  weight?: number;
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
  MULTIPLE_CHOICE = 'multiple-choice',
  SHORT_ANSWER = 'short-answer',
  LONG_ANSWER = 'long-answer',
}

export enum HMSPollStates {
  CREATED = 'created',
  STARTED = 'started',
  STOPPED = 'stopped',
}

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
  id?: string;
  questionIndex: number;
  peer?: HMSPollResponsePeerInfo;
  type?: HMSPollQuestionType;
  skipped?: boolean;
  option?: number;
  options?: number[];
  text?: string;
  update?: boolean; // SDK Needs to track whether we previously answered and set accordingly
  duration?: number; // Time it took to answer the question for leaderboard
  responseFinal?: boolean; // Indicates whether this is last update when fetching responses
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

export interface HMSPollResult {
  /**
   * The number of unique users who responded to the poll
   */
  totalUsers?: number;
  /**
   * The maximum number of users in the room during the poll.
   */
  maxUsers?: number;
  totalResponses?: number;
}

export interface HMSPollQuestionResult {
  correctResponses?: number;
  skippedCount?: number;
  totalResponses?: number;
}

export interface HMSQuizLeaderboardEntry {
  position: number;
  score: number;
  totalResponses: number;
  correctResponses: number;
  duration: number;
  peer: HMSPollResponsePeerInfo;
}

export interface HMSQuizLeaderboardSummary {
  avgScore: number;
  avgTime: number;
  votedUsers: number;
  totalUsers: number;
  correctUsers: number;
}

export interface HMSQuizLeaderboardResponse {
  entries: HMSQuizLeaderboardEntry[];
  hasNext: boolean;
  summary?: HMSQuizLeaderboardSummary;
}
