import { HMSPoll, HMSPollQuestionResponse, HMSPollsUpdate, HMSUpdateListener } from '../../interfaces';
import { Store } from '../../sdk/store';
import { createHMSPollFromPollParams } from '../../session-store/interactivity-center/HMSInteractivityCenter';
import { PollResult } from '../../signal/interfaces';
import HMSTransport from '../../transport';
import { convertDateNumToDate } from '../../utils/date';
import { HMSNotificationMethod } from '../HMSNotificationMethod';
import { PollStartNotification, PollStatsNotification, PollStopNotification } from '../HMSNotifications';

export class PollsManager {
  constructor(private store: Store, private transport: HMSTransport, public listener?: HMSUpdateListener) {}

  handleNotification(method: string, notification: any) {
    switch (method) {
      case HMSNotificationMethod.POLL_START: {
        this.handlePollStart(notification as PollStartNotification);
        break;
      }

      case HMSNotificationMethod.POLL_STOP: {
        this.handlePollStop(notification as PollStopNotification);
        break;
      }
      case HMSNotificationMethod.POLL_STATS:
        this.handlePollStats(notification as PollStatsNotification);

        break;
      default:
        break;
    }
  }

  private async handlePollStart(notification: PollStartNotification) {
    const polls: HMSPoll[] = [];

    for (const pollParams of notification.polls) {
      const pollInStore = this.store.getPoll(pollParams.poll_id);

      if (pollInStore && pollInStore.state === 'started') {
        this.listener?.onPollsUpdate(HMSPollsUpdate.POLL_STARTED, [pollInStore]);
        return;
      }

      const questions = await this.transport.signal.getPollQuestions({
        poll_id: pollParams.poll_id,
        index: 0,
        count: 50,
      });

      const poll = createHMSPollFromPollParams(pollParams);
      poll.questions = questions.questions.map(({ question, options, answer }) => ({ ...question, options, answer }));

      await this.updatePollResponses(poll, true);

      polls.push(poll);
      this.store.setPoll(poll);
    }
    this.listener?.onPollsUpdate(HMSPollsUpdate.POLL_STARTED, polls);
  }

  private async handlePollStop(notification: PollStopNotification) {
    const stoppedPolls: HMSPoll[] = [];

    for (const poll of notification.polls) {
      const savedPoll = this.store.getPoll(poll.poll_id);
      if (savedPoll) {
        savedPoll.state = 'stopped';
        savedPoll.stoppedAt = convertDateNumToDate(poll.stopped_at);
        savedPoll.stoppedBy = poll.stopped_by;

        const pollResult = await this.transport.signal.getPollResult({ poll_id: poll.poll_id });
        this.updatePollResult(savedPoll, pollResult);
        stoppedPolls.push(savedPoll);
      }
    }

    if (stoppedPolls.length > 0) {
      this.listener?.onPollsUpdate(HMSPollsUpdate.POLL_STOPPED, stoppedPolls);
    }
  }

  private async handlePollStats(notification: PollStatsNotification) {
    const updatedPolls: HMSPoll[] = [];
    for (const updatedPoll of notification.polls) {
      const savedPoll = this.store.getPoll(updatedPoll.poll_id);
      if (!savedPoll) {
        return;
      }

      this.updatePollResult(savedPoll, updatedPoll);
      await this.updatePollResponses(savedPoll, false);

      updatedPolls.push(savedPoll);
    }

    if (updatedPolls.length > 0) {
      this.listener?.onPollsUpdate(HMSPollsUpdate.POLL_STATS_UPDATED, updatedPolls);
    }
  }

  private updatePollResult(savedPoll: HMSPoll, pollResult: PollResult) {
    savedPoll.result = { ...savedPoll.result };
    savedPoll.result.totalUsers = pollResult.user_count;
    savedPoll.result.maxUsers = pollResult.max_user;
    savedPoll.result.totalResponses = pollResult.total_response;

    pollResult.questions?.forEach(updatedQuestion => {
      const savedQuestion = savedPoll.questions?.find(question => question.index === updatedQuestion.question);
      if (!savedQuestion) {
        return;
      }
      savedQuestion.result = { ...savedQuestion.result };
      savedQuestion.result.correctResponses = updatedQuestion.correct;
      savedQuestion.result.skippedCount = updatedQuestion.skipped;
      savedQuestion.result.totalResponses = updatedQuestion.total;

      updatedQuestion.options?.forEach((updatedVoteCount, index) => {
        const savedOption = savedQuestion.options?.[index];
        if (savedOption && savedOption.voteCount !== updatedVoteCount) {
          savedOption.voteCount = updatedVoteCount;
        }
      });
    });
  }

  private async updatePollResponses(poll: HMSPoll, self: boolean) {
    const serverResponseParams = await this.transport.signal.getPollResponses({
      poll_id: poll.id,
      index: 0,
      count: 50,
      self,
    });

    serverResponseParams.responses?.forEach(({ response, peer, final }) => {
      const question = poll?.questions?.find(question => question.index === response.question);
      if (!question) {
        return;
      }
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

      if (Array.isArray(question.responses) && question.responses.length > 0) {
        if (!question.responses.find(({ id }) => id === pollResponse.id)) {
          question.responses.push(pollResponse);
        }
      } else {
        question.responses = [pollResponse];
      }
    });
  }
}
