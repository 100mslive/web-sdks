import { HMSPollCreateParams, HMSPollQuestionResponseCreateParams, HMSSdk } from '@100mslive/hms-video';

export interface IHMSInteractivityCenter {
  startPoll(poll: HMSPollCreateParams): void;
}

export class HMSInteractivityCenter {
  constructor(private sdk: HMSSdk) {}

  private get sdkInteractivityCenter() {
    return this.sdk.getInteractivityCenter();
  }

  startPoll(poll: HMSPollCreateParams) {
    this.sdkInteractivityCenter.startPoll(poll);
  }

  addResponseToPoll(pollID: string, responses: HMSPollQuestionResponseCreateParams[]) {
    this.sdkInteractivityCenter.addResponsesToPoll(pollID, responses);
  }
}
