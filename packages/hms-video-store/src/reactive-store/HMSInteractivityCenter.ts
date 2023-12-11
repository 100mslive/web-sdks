import { HMSWhiteboardInteractivityCenter } from '../interfaces/session-store/interactivity-center';
import {
  HMSPoll,
  HMSPollCreateParams,
  HMSPollQuestionCreateParams,
  HMSPollQuestionResponseCreateParams,
  HMSWhiteboardCreateOptions,
} from '../internal';
import { IHMSInteractivityCenter } from '../schema';
import { HMSSdk } from '../sdk';

class WhiteboardInteractivityCenter implements HMSWhiteboardInteractivityCenter {
  constructor(private sdk: HMSSdk) {}

  async open(createOptions?: HMSWhiteboardCreateOptions) {
    await this.sdk.getInteractivityCenter().whiteboard.open(createOptions);
  }

  async close(id?: string) {
    await this.sdk.getInteractivityCenter().whiteboard.close(id);
  }
}

export class HMSInteractivityCenter implements IHMSInteractivityCenter {
  whiteboard = new WhiteboardInteractivityCenter(this.sdk);
  constructor(private sdk: HMSSdk) {}

  private get sdkInteractivityCenter() {
    return this.sdk.getInteractivityCenter();
  }

  createPoll(poll: HMSPollCreateParams) {
    return this.sdkInteractivityCenter.createPoll(poll);
  }

  startPoll(poll: string | HMSPollCreateParams) {
    return this.sdkInteractivityCenter.startPoll(poll);
  }

  stopPoll(poll: string) {
    return this.sdkInteractivityCenter.stopPoll(poll);
  }

  addQuestionsToPoll(poll: string, questions: HMSPollQuestionCreateParams[]) {
    return this.sdkInteractivityCenter.addQuestionsToPoll(poll, questions);
  }

  addResponsesToPoll(pollID: string, responses: HMSPollQuestionResponseCreateParams[]) {
    return this.sdkInteractivityCenter.addResponsesToPoll(pollID, responses);
  }

  fetchLeaderboard(poll: HMSPoll, offset: number, count: number) {
    return this.sdkInteractivityCenter.fetchLeaderboard(poll, offset, count);
  }
}
