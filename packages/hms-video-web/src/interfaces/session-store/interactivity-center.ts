import { HMSPollCreateParams, HMSPollQuestionCreateParams, HMSPollQuestionResponse } from './polls';
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
  addResponsesToPoll(pollID: string, response: HMSPollQuestionResponse[]): Promise<void>;
  getResponses(pollID: string): Promise<Array<HMSPollQuestionResponse>>;

  /** @alpha */
  whiteboard: HMSWhiteboardInteractivityCenter;
}
