import { HMSPollQuestionCreateParams } from '../../interfaces';
import { HMSInteractivityCenter } from '../../interfaces/session-store/interactivity-center';
import {
  HMSPollCreateParams,
  HMSPollQuestionAnswer,
  HMSPollQuestionOption,
  HMSPollQuestionResponse,
  HMSPollQuestionType,
} from '../../interfaces/session-store/polls';
import { PollQuestionParams } from '../../signal/interfaces';
import HMSTransport from '../../transport';

export class InteractivityCenter implements HMSInteractivityCenter {
  constructor(private transport: HMSTransport) {}

  async startPoll(pollParams: HMSPollCreateParams): Promise<void> {
    const { poll_id: serverPollID } = await this.transport.pollInfoSet({
      ...pollParams,
      poll_id: pollParams.id,
      vote: pollParams.rolesThatCanVote,
      responses: pollParams.rolesThaCanViewResponses,
    });

    if (!pollParams.id) {
      pollParams.id = serverPollID;
    }

    if (Array.isArray(pollParams.questions) && pollParams.questions.length > 0) {
      await this.addQuestionToPoll(pollParams.id, pollParams.questions);
    }

    await this.transport.pollStart({ poll_id: pollParams.id });
  }

  async addQuestionToPoll(pollID: string, questions: HMSPollQuestionCreateParams[]): Promise<void> {
    await this.transport.pollQuestionsSet({
      poll_id: pollID,
      questions: questions.map((question, index) => this.createQuestionSetParams(question, index)),
    });
  }

  async stopPoll(pollID: string): Promise<void> {
    await this.transport.pollStop({ poll_id: pollID });
  }

  addResponse(_response: HMSPollQuestionResponse): Promise<void> {
    throw new Error('Method not implemented.');
  }
  getResponses(_pollID: string): Promise<HMSPollQuestionResponse[]> {
    throw new Error('Method not implemented.');
  }

  private createQuestionSetParams(questionParams: HMSPollQuestionCreateParams, index: number): PollQuestionParams {
    const question: PollQuestionParams['question'] = { ...questionParams, index: index + 1 };
    let options: HMSPollQuestionOption[] | undefined;
    const answer: HMSPollQuestionAnswer = questionParams.answer || { hidden: false };
    if (
      Array.isArray(questionParams.options) &&
      [HMSPollQuestionType.SINGLE_CHOICE, HMSPollQuestionType.MULTI_CHOICE].includes(questionParams.type)
    ) {
      options = questionParams.options?.map((option, index) => ({
        index: index + 1,
        text: option.text,
        weight: option.weight,
      }));

      delete answer?.text;
      if (questionParams.type === HMSPollQuestionType.SINGLE_CHOICE) {
        answer.option = questionParams.options.findIndex(option => option.isCorrectAnswer) + 1 || undefined;
      } else {
        answer.options = questionParams.options
          .map((option, index) => (option.isCorrectAnswer ? index + 1 : undefined))
          .filter((val): val is number => !!val);
      }
    } else {
      delete answer?.options;
      delete answer?.option;
    }

    return { question, options, answer };
  }
}
