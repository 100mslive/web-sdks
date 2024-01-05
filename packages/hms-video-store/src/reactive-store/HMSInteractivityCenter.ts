import { HMSPollCreateParams, HMSPollQuestionCreateParams, HMSPollQuestionResponseCreateParams } from '../internal';
import { IHMSInteractivityCenter } from '../schema';
import { HMSSdk } from '../sdk';

export class HMSInteractivityCenter implements IHMSInteractivityCenter {
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
}