import { HMSPollCreateParams, HMSPollQuestionCreateParams, HMSPollQuestionResponseCreateParams } from '../interfaces';
import { HMSWhiteboardInteractivityCenter } from '../interfaces/session-store/interactivity-center';

export interface IHMSInteractivityCenter {
  whiteboard: HMSWhiteboardInteractivityCenter;

  createPoll(poll: HMSPollCreateParams): Promise<void>;
  startPoll(poll: string | HMSPollCreateParams): Promise<void>;
  stopPoll(poll: string): Promise<void>;
  addQuestionsToPoll(pollID: string, questions: HMSPollQuestionCreateParams[]): Promise<void>;
  addResponsesToPoll(pollID: string, responses: HMSPollQuestionResponseCreateParams[]): Promise<void>;
}
