import { HMSPollCreateParams, HMSPollQuestionCreateParams, HMSPollQuestionResponse } from './polls';

export interface HMSInteractivityCenter {
  createPoll(poll: HMSPollCreateParams): Promise<void>;
  addQuestionsToPoll(pollID: string, questions: HMSPollQuestionCreateParams[]): Promise<void>;
  startPoll(poll: string | HMSPollCreateParams): Promise<void>;
  stopPoll(pollID: string): Promise<void>;
  addResponsesToPoll(pollID: string, response: HMSPollQuestionResponse[]): Promise<void>;
  getResponses(pollID: string): Promise<Array<HMSPollQuestionResponse>>;
}
