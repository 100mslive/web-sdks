import { HMSPollCreateParams, HMSPollQuestionResponse } from './polls';

export interface HMSInteractivityCenter {
  startPoll(poll: HMSPollCreateParams): Promise<void>;
  stopPoll(pollID: string): Promise<void>;
  addResponsesToPoll(pollID: string, response: HMSPollQuestionResponse[]): Promise<void>;
  getResponses(pollID: string): Promise<Array<HMSPollQuestionResponse>>;
}
