import {
  HMSPoll,
  HMSPollCreateParams,
  HMSPollQuestionCreateParams,
  HMSPollQuestionResponseCreateParams,
  HMSQuizLeaderboardResponse,
  HMSWhiteboardInteractivityCenter,
} from '@100mslive/hms-video';

export interface IHMSInteractivityCenter {
  whiteboard: HMSWhiteboardInteractivityCenter;

  createPoll(poll: HMSPollCreateParams): Promise<void>;
  startPoll(poll: string | HMSPollCreateParams): Promise<void>;
  stopPoll(poll: string): Promise<void>;
  addQuestionsToPoll(pollID: string, questions: HMSPollQuestionCreateParams[]): Promise<void>;
  addResponsesToPoll(pollID: string, responses: HMSPollQuestionResponseCreateParams[]): Promise<void>;
  fetchLeaderboard(poll: HMSPoll, offset: number, count: number): Promise<HMSQuizLeaderboardResponse>;
}
