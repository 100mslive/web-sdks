import AnalyticsEvent from '../analytics/AnalyticsEvent';
import AnalyticsEventFactory from '../analytics/AnalyticsEventFactory';
import { AnalyticsEventsService } from '../analytics/AnalyticsEventsService';
import HMSException from '../error/HMSException';
import { MAX_TRANSPORT_RETRIES, MAX_TRANSPORT_RETRY_DELAY } from '../utils/constants';
import HMSLogger from '../utils/logger';
import { PromiseCallbacks } from '../utils/promise';
import { TransportFailureCategory as TFC } from './models/TransportFailureCategory';
import { TransportState } from './models/TransportState';

/**
 * Task which is executed by [RetryScheduler.schedule] until max retry count
 * is reached.
 *
 * Any exception raised while executing the task assumes that task is failed.
 * Failed tasks are retried if max retry count is not reached.
 *
 * @returns True if the task if successful, otherwise False
 *
 *
 */
type RetryTask = () => Promise<boolean>;

const TAG = '[RetryScheduler]';

export class RetryScheduler {
  private analyticsEventsService: AnalyticsEventsService;
  private onStateChange: (state: TransportState, error?: HMSException) => void;

  private inProgress = new Map<TFC, PromiseCallbacks<number>>();
  private retryTaskIds: number[] = [];

  constructor(
    analyticsEventsService: AnalyticsEventsService,
    onStateChange: (state: TransportState, error?: HMSException) => void,
  ) {
    this.analyticsEventsService = analyticsEventsService;
    this.onStateChange = onStateChange;
  }

  async schedule(
    category: TFC,
    error: HMSException,
    task: RetryTask,
    maxFailedRetries = MAX_TRANSPORT_RETRIES,
    changeState = true,
  ) {
    await this.scheduleTask(category, error, changeState, task, maxFailedRetries);
  }

  reset() {
    this.retryTaskIds.forEach((future) => clearTimeout(future));
    this.retryTaskIds = [];
  }

  private async scheduleTask(
    category: TFC,
    error: HMSException,
    changeState: Boolean,
    task: RetryTask,
    maxFailedRetries = MAX_TRANSPORT_RETRIES,
    failedRetryCount = 0,
  ) {
    HMSLogger.d(TAG, 'schedule: ', { category, error });

    if (failedRetryCount === 0) {
      new Promise<number>((resolve, reject) => {
        this.inProgress.set(category, { resolve, reject });
      });

      this.sendEvent(error, category);
    }

    if (failedRetryCount >= maxFailedRetries) {
      error.description += `. [${TFC[category]}] Could not recover after ${failedRetryCount} tries`;

      const taskPromise = this.inProgress.get(category);
      this.inProgress.delete(category);
      taskPromise?.reject(error);
      this.sendEvent(error, category);

      if (changeState) {
        this.onStateChange(TransportState.Failed, error);
      } else {
        throw error;
      }

      return;
    }

    if (changeState) {
      this.onStateChange(TransportState.Reconnecting, error);
    }

    const delay = this.getDelayForRetryCount(failedRetryCount);

    HMSLogger.i(
      TAG,
      `schedule: [${TFC[category]}] [failedRetryCount=${failedRetryCount}] Scheduling retry task in ${delay}ms`,
    );

    const deferred = new Promise<void>((resolve) => {
      const future = window.setTimeout(async () => {
        let success: boolean;
        try {
          success = await task();
        } catch (ex) {
          HMSLogger.w(TAG, `[${TFC[category]}] Un-caught exception ${ex.name} in retry-task, initiating retry`, ex);
          success = false;
        }

        if (success) {
          const taskPromise = this.inProgress.get(category);
          this.inProgress.delete(category);
          taskPromise?.resolve(failedRetryCount);

          if (changeState) {
            this.onStateChange(TransportState.Joined);
          }
        } else {
          this.scheduleTask(category, error, changeState, task, maxFailedRetries, failedRetryCount + 1);
        }

        resolve();
      }, delay);

      this.retryTaskIds.push(future);
    });

    await deferred;
  }

  private sendEvent(error: HMSException, category: TFC) {
    let event: AnalyticsEvent;
    switch (category) {
      case TFC.SignalDisconnect:
        event = AnalyticsEventFactory.disconnect(error);
        break;
      case TFC.PublishIceConnectionFailed:
        event = AnalyticsEventFactory.publishFail(error);
        break;
      case TFC.SubscribeIceConnectionFailed:
        event = AnalyticsEventFactory.subscribeFail(error);
        break;
    }
    this.analyticsEventsService.queue(event!).flush();
  }

  private getDelayForRetryCount(n: number) {
    let delay = Math.pow(2, n);
    const jitter = Math.random();
    return Math.round(Math.min(delay + jitter, MAX_TRANSPORT_RETRY_DELAY) * 1000);
  }
}
