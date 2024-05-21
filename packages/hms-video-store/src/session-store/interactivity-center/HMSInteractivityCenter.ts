import { WhiteboardInteractivityCenter } from './HMSWhiteboardCenter';
import {
  HMSInteractivityCenter,
  HMSPollQuestionCreateParams,
  HMSPollsUpdate,
  InteractivityListener,
} from '../../interfaces';
import {
  HMSPoll,
  HMSPollCreateParams,
  HMSPollQuestionAnswer,
  HMSPollQuestionOption,
  HMSPollQuestionResponse,
  HMSPollQuestionResponseCreateParams,
  HMSPollQuestionType,
  HMSPollStates,
  HMSPollUserTrackingMode,
  HMSQuizLeaderboardResponse,
} from '../../interfaces/session-store/polls';
import { Store } from '../../sdk/store';
import { PollInfoParams, PollQuestionParams, PollResponseParams } from '../../signal/interfaces';
import HMSTransport from '../../transport';
import { convertDateNumToDate } from '../../utils/date';

export class InteractivityCenter implements HMSInteractivityCenter {
  whiteboard: WhiteboardInteractivityCenter;
  constructor(private transport: HMSTransport, private store: Store, private listener?: InteractivityListener) {
    this.whiteboard = new WhiteboardInteractivityCenter(transport, store, listener);
  }

  setListener(listener?: InteractivityListener) {
    this.listener = listener;
    this.whiteboard.setListener(listener);
  }

  async createPoll(pollParams: HMSPollCreateParams) {
    const HMS_USER_TRACKING_MODE_MAP: Record<HMSPollUserTrackingMode, string> = {
      customerID: 'userid',
      peerID: 'peerid',
      userName: 'username',
    };

    const { poll_id: serverPollID } = await this.transport.signal.setPollInfo({
      ...pollParams,
      mode: pollParams.mode ? HMS_USER_TRACKING_MODE_MAP[pollParams.mode] : undefined,
      poll_id: pollParams.id,
      vote: pollParams.rolesThatCanVote,
      responses: pollParams.rolesThatCanViewResponses,
    });

    if (!pollParams.id) {
      pollParams.id = serverPollID;
    }

    if (Array.isArray(pollParams.questions)) {
      await this.addQuestionsToPoll(pollParams.id, pollParams.questions);
    }

    const questions = await this.transport.signal.getPollQuestions({ poll_id: pollParams.id, index: 0, count: 50 });

    const poll = createHMSPollFromPollParams({
      ...pollParams,
      poll_id: pollParams.id,
      state: 'created',
      created_by: this.store.getLocalPeer()?.peerId,
    });

    poll.questions = questions.questions.map(({ question, options, answer }) => ({ ...question, options, answer }));
    this.listener?.onPollsUpdate(HMSPollsUpdate.POLL_CREATED, [poll]);
  }

  async startPoll(poll: string | HMSPollCreateParams): Promise<void> {
    if (typeof poll === 'string') {
      await this.transport.signal.startPoll({ poll_id: poll });
    } else {
      await this.createPoll(poll);
      await this.transport.signal.startPoll({ poll_id: poll.id });
    }
  }

  async addQuestionsToPoll(pollID: string, questions: HMSPollQuestionCreateParams[]): Promise<void> {
    if (questions.length > 0) {
      await this.transport.signal.setPollQuestions({
        poll_id: pollID,
        questions: questions.map((question, index) => this.createQuestionSetParams(question, index)),
      });
    }
  }

  async stopPoll(pollID: string): Promise<void> {
    await this.transport.signal.stopPoll({ poll_id: pollID });
  }

  async addResponsesToPoll(pollID: string, responses: HMSPollQuestionResponseCreateParams[]) {
    const poll = this.store.getPoll(pollID);
    if (!poll) {
      throw new Error('Invalid poll ID - Poll not found');
    }
    const responsesParams: PollResponseParams[] = responses.map(response => {
      const question = this.getQuestionInPoll(poll, response.questionIndex);
      if (question.type === HMSPollQuestionType.SINGLE_CHOICE) {
        response.option = response.option || response.options?.[0] || -1;
        delete response.text;
        delete response.options;
      } else if (question.type === HMSPollQuestionType.MULTIPLE_CHOICE) {
        response.options?.sort();
        delete response.text;
        delete response.option;
      } else {
        delete response.option;
        delete response.options;
      }

      if (response.skipped) {
        delete response.option;
        delete response.options;
        delete response.text;
      }

      return { duration: 0, type: question.type, question: response.questionIndex, ...response };
    });

    await this.transport.signal.setPollResponses({ poll_id: pollID, responses: responsesParams });
  }

  async fetchLeaderboard(pollID: string, offset: number, count: number): Promise<HMSQuizLeaderboardResponse> {
    const poll = this.store.getPoll(pollID);
    if (!poll) {
      throw new Error('Invalid poll ID - Poll not found');
    }

    const localPeerPermissions = this.store.getLocalPeer()?.role?.permissions;
    const canViewSummary = !!(localPeerPermissions?.pollRead || localPeerPermissions?.pollWrite);

    if (poll.anonymous || poll.state !== HMSPollStates.STOPPED || !canViewSummary) {
      return { entries: [], hasNext: false };
    }
    const pollLeaderboard = await this.transport.signal.fetchPollLeaderboard({
      poll_id: poll.id,
      count,
      offset,
    });

    const summary = {
      avgScore: pollLeaderboard.avg_score,
      avgTime: pollLeaderboard.avg_time,
      votedUsers: pollLeaderboard.voted_users,
      totalUsers: pollLeaderboard.total_users,
      correctUsers: pollLeaderboard.correct_users,
    };

    const leaderboardEntries = pollLeaderboard.questions.map(question => {
      return {
        position: question.position,
        totalResponses: question.total_responses,
        correctResponses: question.correct_responses,
        duration: question.duration,
        peer: question.peer,
        score: question.score,
      };
    });

    return { entries: leaderboardEntries, hasNext: !pollLeaderboard.last, summary };
  }

  async getPollResponses(poll: HMSPoll, self: boolean) {
    const serverResponseParams = await this.transport.signal.getPollResponses({
      poll_id: poll.id,
      index: 0,
      count: 50,
      self,
    });
    const pollCopy = JSON.parse(JSON.stringify(poll));
    serverResponseParams.responses?.forEach(({ response, peer, final }) => {
      const question = poll?.questions?.find(question => question.index === response.question);
      if (question) {
        const pollResponse: HMSPollQuestionResponse = {
          id: response.response_id,
          questionIndex: response.question,
          option: response.option,
          options: response.options,
          text: response.text,
          responseFinal: final,
          peer: { peerid: peer.peerid, userHash: peer.hash, userid: peer.userid, username: peer.username },
          skipped: response.skipped,
          type: response.type,
          update: response.update,
        };
        const existingResponses = question.responses && !self ? [...question.responses] : [];

        if (pollCopy.questions?.[response.question - 1]) {
          pollCopy.questions[response.question - 1].responses = [...existingResponses, pollResponse];
        }
      }
    });
    this.store.setPoll(pollCopy);
    this.listener?.onPollsUpdate(HMSPollsUpdate.POLL_STATS_UPDATED, [pollCopy]);
  }
  async getPolls(): Promise<HMSPoll[]> {
    const launchedPollsList = await this.transport.signal.getPollsList({ count: 50, state: 'started' });
    const polls: HMSPoll[] = [];
    const canViewAllPolls = this.store.getLocalPeer()?.role?.permissions.pollWrite;

    let visiblePolls = [...launchedPollsList.polls];
    if (canViewAllPolls) {
      const draftPollsList = await this.transport.signal.getPollsList({ count: 50, state: 'created' });
      const completedPollsList = await this.transport.signal.getPollsList({ count: 50, state: 'stopped' });
      visiblePolls = [...draftPollsList.polls, ...visiblePolls, ...completedPollsList.polls];
    }

    for (const pollParams of visiblePolls) {
      const questions = await this.transport.signal.getPollQuestions({
        poll_id: pollParams.poll_id,
        index: 0,
        count: 50,
      });
      const poll = createHMSPollFromPollParams(pollParams);
      const existingPoll = this.store.getPoll(pollParams.poll_id);
      poll.questions = questions.questions.map(({ question, options, answer }, index) => ({
        ...question,
        options,
        answer,
        responses: existingPoll?.questions?.[index]?.responses,
      }));
      polls.push(poll);
      this.store.setPoll(poll);
    }

    this.listener?.onPollsUpdate(HMSPollsUpdate.POLLS_LIST, polls);
    return polls;
  }

  // eslint-disable-next-line complexity
  private createQuestionSetParams(questionParams: HMSPollQuestionCreateParams, index: number): PollQuestionParams {
    // early return if the question has been saved before in a draft
    if (questionParams.index) {
      const optionsWithIndex = questionParams.options?.map((option, index) => {
        return { ...option, index: index + 1 };
      });
      return {
        question: { ...questionParams, index: index + 1 },
        options: optionsWithIndex,
        answer: questionParams.answer,
      };
    }
    const question: PollQuestionParams['question'] = { ...questionParams, index: index + 1 };
    let options: HMSPollQuestionOption[] | undefined;
    const answer: HMSPollQuestionAnswer = questionParams.answer || { hidden: false };

    if (
      Array.isArray(questionParams.options) &&
      [HMSPollQuestionType.SINGLE_CHOICE, HMSPollQuestionType.MULTIPLE_CHOICE].includes(questionParams.type)
    ) {
      options = questionParams.options?.map((option, index) => ({
        index: index + 1,
        text: option.text,
        weight: option.weight,
      }));

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

  private getQuestionInPoll(poll: HMSPoll, questionIndex: number) {
    const question = poll?.questions?.find(question => question.index === questionIndex);
    if (!question) {
      throw new Error('Invalid question index - Question not found in poll');
    }

    return question;
  }
}

export const createHMSPollFromPollParams = (pollParams: PollInfoParams): HMSPoll => {
  const BIZ_USER_TRACKING_MODE_MAP: Record<string, HMSPollUserTrackingMode> = {
    userid: 'customerID',
    peerid: 'peerID',
    username: 'userName',
  };

  return {
    id: pollParams.poll_id,
    title: pollParams.title,
    startedBy: pollParams.started_by,
    createdBy: pollParams.created_by,
    anonymous: pollParams.anonymous,
    type: pollParams.type,
    duration: pollParams.duration,
    locked: pollParams.locked, // poll is locked automatically when it starts
    mode: pollParams.mode ? BIZ_USER_TRACKING_MODE_MAP[pollParams.mode] : undefined,
    visibility: pollParams.visibility,
    rolesThatCanVote: pollParams.vote || [],
    rolesThatCanViewResponses: pollParams.responses || [],
    state: pollParams.state,
    stoppedBy: pollParams.stopped_by,
    startedAt: convertDateNumToDate(pollParams.started_at),
    stoppedAt: convertDateNumToDate(pollParams.stopped_at),
    createdAt: convertDateNumToDate(pollParams.created_at),
  };
};
