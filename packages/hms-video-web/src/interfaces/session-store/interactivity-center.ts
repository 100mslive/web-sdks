import { HMSPollCreateParams, HMSPollQuestionResponse } from './polls';

export interface HMSInteractivityCenter {
  startPoll(poll: HMSPollCreateParams): Promise<void>;
  stopPoll(pollID: string): Promise<void>;
  // addResponse(response: ): Promise<void>;
  getResponses(pollID: string): Promise<Array<HMSPollQuestionResponse>>;
}
