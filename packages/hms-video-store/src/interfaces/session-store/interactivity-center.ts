import {
  HMSPoll,
  HMSPollCreateParams,
  HMSPollQuestionCreateParams,
  HMSPollQuestionResponseCreateParams,
  HMSQuizLeaderboardResponse,
} from './polls';
import { HMSWhiteboardCreateOptions } from './whiteboard';

export interface HMSWhiteboardInteractivityCenter {
  isEnabled: boolean;
  open(createOptions?: HMSWhiteboardCreateOptions): Promise<void>;
  close(id?: string): Promise<void>;
}

export interface HMSInteractivityCenter {
  createPoll(poll: HMSPollCreateParams): Promise<void>;
  addQuestionsToPoll(pollID: string, questions: HMSPollQuestionCreateParams[]): Promise<void>;
  startPoll(poll: string | HMSPollCreateParams): Promise<void>;
  stopPoll(pollID: string): Promise<void>;
  addResponsesToPoll(pollID: string, responses: HMSPollQuestionResponseCreateParams[]): Promise<void>;
  fetchLeaderboard(pollID: string, offset: number, count: number): Promise<HMSQuizLeaderboardResponse>;
  getPollResponses(poll: HMSPoll, self: boolean): Promise<void>;
  getPolls(): Promise<HMSPoll[]>;
  whiteboard: HMSWhiteboardInteractivityCenter;
}
