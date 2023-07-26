import { HMSPoll, HMSPollQuestionResponse, HMSPollsUpdate, HMSUpdateListener } from '../../interfaces';
import { IStore } from '../../sdk/store';
import { PollResult } from '../../signal/interfaces';
import HMSTransport from '../../transport';
import { convertDateNumToDate } from '../../utils/date';
import { HMSNotificationMethod } from '../HMSNotificationMethod';
import { PollStartNotification, PollStatsNotification, PollStopNotification } from '../HMSNotifications';

export class PollsManager {
  constructor(private store: IStore, private transport: HMSTransport, public listener?: HMSUpdateListener) {}

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
      const questions = await this.transport.getPollQuestions({ poll_id: pollParams.poll_id, index: 0, count: 50 });
      const poll: HMSPoll = {
        id: pollParams.poll_id,
        title: pollParams.title,
        startedBy: pollParams.started_by,
        createdBy: pollParams.created_by,
        anonymous: pollParams.anonymous,
        type: pollParams.type,
        duration: pollParams.duration,
        locked: pollParams.locked, // poll is locked automatically when it starts
        mode: pollParams.mode as HMSPoll['mode'],
        visibility: pollParams.visibility,
        rolesThatCanVote: pollParams.vote || [],
        rolesThatCanViewResponses: pollParams.responses || [],
        state: pollParams.state,
        stoppedBy: pollParams.stopped_by,
        startedAt: convertDateNumToDate(pollParams.started_at),
        stoppedAt: convertDateNumToDate(pollParams.stopped_at),
        createdAt: convertDateNumToDate(pollParams.created_at),

        questions: questions.questions.map(({ question, options, answer }) => ({ ...question, options, answer })),
      };

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

        const pollResult = await this.transport.getPollResult({ poll_id: poll.poll_id });
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

      const serverResponseParams = await this.transport.getPollResponses({
        poll_id: updatedPoll.poll_id,
        index: 0,
        count: 50,
        self: false,
      });

      serverResponseParams.responses?.forEach(({ response, peer, final }) => {
        const question = savedPoll?.questions?.find(question => question.index === response.question);
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
}
