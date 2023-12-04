import { HMSPollCreateParams, HMSPollQuestionCreateParams, HMSPollQuestionResponseCreateParams } from '../interfaces';

export interface IHMSWhiteboardInteractivityCenter {
  openWhiteboard(): Promise<void>;
}

export interface IHMSInteractivityCenter {
  whiteboard: IHMSWhiteboardInteractivityCenter;

  createPoll(poll: HMSPollCreateParams): Promise<void>;
  startPoll(poll: string | HMSPollCreateParams): Promise<void>;
  stopPoll(poll: string): Promise<void>;
  addQuestionsToPoll(pollID: string, questions: HMSPollQuestionCreateParams[]): Promise<void>;
  addResponsesToPoll(pollID: string, responses: HMSPollQuestionResponseCreateParams[]): Promise<void>;
}
