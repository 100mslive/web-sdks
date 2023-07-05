import { HMSPoll, HMSPollsUpdate, HMSUpdateListener } from '../../interfaces';
import { IStore } from '../../sdk/store';
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
        // mode: pollParams.mode,
        visibility: pollParams.visibility,
        rolesThatCanVote: pollParams.vote || [],
        rolesThaCanViewResponses: pollParams.responses || [],
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

  private handlePollStop(notification: PollStopNotification) {
    const stoppedPolls: HMSPoll[] = [];
    notification.polls.forEach(poll => {
      const savedPoll = this.store.getPoll(poll.poll_id);
      if (savedPoll) {
        savedPoll.state = 'stopped';
        savedPoll.stoppedAt = convertDateNumToDate(poll.stopped_at);
        savedPoll.stoppedBy = poll.stopped_by;
        stoppedPolls.push(savedPoll);
      }
    });

    if (stoppedPolls.length > 0) {
      this.listener?.onPollsUpdate(HMSPollsUpdate.POLL_STOPPED, stoppedPolls);
    }
  }

  private handlePollStats(notification: PollStatsNotification) {
    const updatedPolls: HMSPoll[] = [];
    notification.polls.forEach(updatedPoll => {
      const savedPoll = this.store.getPoll(updatedPoll.poll_id);
      if (!savedPoll) {
        return;
      }
      savedPoll.totalUsers = updatedPoll.user_count;
      savedPoll.totalResponses = updatedPoll.total_responses;
      updatedPoll.questions.forEach(updatedQuestion => {
        const savedQuestion = savedPoll.questions?.find(question => question.index === updatedQuestion.question);
        if (!savedQuestion) {
          return;
        }

        savedQuestion.totalResponses = updatedQuestion.total;

        updatedQuestion.options.forEach((updatedVoteCount, index) => {
          const savedOption = savedQuestion.options?.[index];
          if (savedOption && savedOption.voteCount !== updatedVoteCount) {
            savedOption.voteCount = updatedVoteCount;
            updatedPolls.push(savedPoll);
          }
        });
      });
    });

    if (updatedPolls.length > 0) {
      this.listener?.onPollsUpdate(HMSPollsUpdate.POLL_STATS_UPDATED, updatedPolls);
    }
  }
}
