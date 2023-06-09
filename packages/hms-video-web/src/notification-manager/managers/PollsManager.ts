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
      const questions = await this.transport.pollQuestionsGet({ poll_id: pollParams.poll_id, index: 0, count: 50 });
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
    }
    polls.forEach(poll => this.store.setPoll(poll));
    this.listener?.onPollsUpdate(HMSPollsUpdate.POLL_STARTED, polls);
  }

  private handlePollStop(_notification: PollStopNotification) {}

  private handlePollStats(_notification: PollStatsNotification) {}
}
