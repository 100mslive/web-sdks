import { HMSPollQuestionCreateParams } from '../../interfaces';
import { HMSInteractivityCenter } from '../../interfaces/session-store/interactivity-center';
import {
  HMSPoll,
  HMSPollCreateParams,
  HMSPollQuestionAnswer,
  HMSPollQuestionOption,
  HMSPollQuestionResponse,
  HMSPollQuestionResponseCreateParams,
  HMSPollQuestionType,
} from '../../interfaces/session-store/polls';
import { IStore } from '../../sdk/store';
import { PollQuestionParams, PollResponseParams } from '../../signal/interfaces';
import HMSTransport from '../../transport';

export class InteractivityCenter implements HMSInteractivityCenter {
  constructor(private transport: HMSTransport, private store: IStore) {}

  async createPoll(pollParams: HMSPollCreateParams) {
    const { poll_id: serverPollID } = await this.transport.pollInfoSet({
      ...pollParams,
      poll_id: pollParams.id,
      vote: pollParams.rolesThatCanVote,
      responses: pollParams.rolesThaCanViewResponses,
    });

    if (!pollParams.id) {
      pollParams.id = serverPollID;
    }

    if (Array.isArray(pollParams.questions)) {
      await this.addQuestionsToPoll(pollParams.id, pollParams.questions);
    }
  }

  async startPoll(poll: string | HMSPollCreateParams): Promise<void> {
    if (typeof poll === 'string') {
      await this.transport.pollStart({ poll_id: poll });
    } else {
      await this.createPoll(poll);
      await this.transport.pollStart({ poll_id: poll.id });
    }
  }

  async addQuestionsToPoll(pollID: string, questions: HMSPollQuestionCreateParams[]): Promise<void> {
    if (questions.length > 0) {
      await this.transport.pollQuestionsSet({
        poll_id: pollID,
        questions: questions.map((question, index) => this.createQuestionSetParams(question, index)),
      });
    }
  }

  async stopPoll(pollID: string): Promise<void> {
    await this.transport.pollStop({ poll_id: pollID });
  }

  async addResponsesToPoll(pollID: string, responses: HMSPollQuestionResponseCreateParams[]) {
    const poll = this.store.getPoll(pollID);
    if (!poll) {
      throw new Error('Invalid poll ID - Poll not found');
    }
    const responsesParams: PollResponseParams[] = responses.map(response => {
      const { question } = this.getPollAndQuestion(poll, response.questionIndex);
      if (question.type === HMSPollQuestionType.SINGLE_CHOICE) {
        response.option = response.option || response.options?.[0] || -1;
        delete response.text;
        delete response.options;
      } else if (question.type === HMSPollQuestionType.MULTI_CHOICE) {
        delete response.text;
        delete response.option;
      } else {
        response.text = response.text || '';
        delete response.option;
        delete response.options;
      }

      return { duration: 0, type: question.type, question: response.questionIndex, ...response };
    });

    await this.transport.pollResponseSet({ poll_id: pollID, responses: responsesParams });
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

  private getPollAndQuestion(poll: HMSPoll, questionIndex: number) {
    const question = poll?.questions?.find(question => question.index === questionIndex);
    if (!question) {
      throw new Error('Invalid question index - Question not found in poll');
    }

    return { poll, question };
  }
}
