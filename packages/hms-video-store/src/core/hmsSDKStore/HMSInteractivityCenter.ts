import { HMSPollCreateParams, HMSSdk } from '@100mslive/hms-video';

export interface IHMSInteractivityCenterActions {
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

  // addQuestionToPoll(question: HMSPollQuestionCreateParams) {
  // }

  // addResponseToPoll(response: HMSPollResponseCreateParams) {}
}
