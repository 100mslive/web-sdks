import AnalyticsEvent from '../analytics/AnalyticsEvent';
import AnalyticsEventFactory from '../analytics/AnalyticsEventFactory';
import { AnalyticsEventsService } from '../analytics/AnalyticsEventsService';
import { HMSException } from '../error/HMSException';
import { MAX_TRANSPORT_RETRIES, MAX_TRANSPORT_RETRY_DELAY } from '../utils/constants';
import HMSLogger from '../utils/logger';
import { PromiseWithCallbacks } from '../utils/promise';
import { TransportFailureCategory as TFC, Dependencies as TFCDependencies } from './models/TransportFailureCategory';
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

  private inProgress = new Map<TFC, PromiseWithCallbacks<number>>();
  private retryTaskIds: number[] = [];

  constructor(
    analyticsEventsService: AnalyticsEventsService,
    onStateChange: (state: TransportState, error?: HMSException) => Promise<void>,
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
    this.retryTaskIds.forEach(future => clearTimeout(future));
    this.retryTaskIds = [];
    this.inProgress.clear();
  }

  private async scheduleTask(
    category: TFC,
    error: HMSException,
    changeState: Boolean,
    task: RetryTask,
    maxFailedRetries = MAX_TRANSPORT_RETRIES,
    failedRetryCount = 0,
  ): Promise<void> {
    HMSLogger.d(TAG, 'schedule: ', { category: TFC[category], error });

    // First schedule call
    if (failedRetryCount === 0) {
      const inProgressTask = this.inProgress.get(category);
      if (inProgressTask) {
        HMSLogger.d(TAG, `schedule: Already a task for ${TFC[category]} scheduled, waiting for its completion`);
        await inProgressTask.promise;
        return;
      }

      const taskPromise = new PromiseWithCallbacks<number>((_, __) => {});
      this.inProgress.set(category, taskPromise);

      this.sendEvent(error, category);
    }

    let hasFailedDependency = false;
    const dependencies = TFCDependencies[category];

    for (const dependencyIndexString in dependencies) {
      const dependency = dependencies[parseInt(dependencyIndexString)];
      try {
        const dependencyTask = this.inProgress.get(dependency);
        if (dependencyTask) {
          HMSLogger.d(
            TAG,
            `schedule: Suspending retry task of ${TFC[category]}, waiting for ${TFC[dependency]} to recover`,
          );
          await dependencyTask.promise;
          HMSLogger.d(
            TAG,
            `schedule: Resuming retry task ${TFC[category]} as it's dependency ${TFC[dependency]} is recovered`,
          );
        }
      } catch (ex) {
        HMSLogger.d(
          TAG,
          `schedule: Stopping retry task of ${TFC[category]} as it's dependency ${TFC[dependency]} failed to recover`,
        );
        hasFailedDependency = true;
        break;
      }
    }

    if (failedRetryCount >= maxFailedRetries || hasFailedDependency) {
      error.description += `. [${TFC[category]}] Could not recover after ${failedRetryCount} tries`;

      if (hasFailedDependency) {
        error.description += ` Could not recover all of it's required dependencies - [${(dependencies as Array<TFC>)
          .map(dep => TFC[dep])
          .toString()}]`;
      }
      error.isTerminal = true;

      // @NOTE: Don't reject to throw error for dependencies, use onStateChange
      // const taskPromise = this.inProgress.get(category);
      this.inProgress.delete(category);
      // taskPromise?.reject(error);
      this.sendEvent(error, category);

      this.reset();

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

    let taskSucceeded: boolean;
    try {
      taskSucceeded = await this.setTimeoutPromise(task, delay);
    } catch (ex) {
      taskSucceeded = false;
      HMSLogger.w(
        TAG,
        `[${TFC[category]}] Un-caught exception ${(ex as HMSException).name} in retry-task, initiating retry`,
        ex,
      );
    }

    if (taskSucceeded) {
      const taskPromise = this.inProgress.get(category);
      this.inProgress.delete(category);
      taskPromise?.resolve(failedRetryCount);

      if (changeState && this.inProgress.size === 0) {
        this.onStateChange(TransportState.Joined);
      }
      HMSLogger.i(TAG, `schedule: [${TFC[category]}] [failedRetryCount=${failedRetryCount}] Recovered ♻️`);
    } else {
      await this.scheduleTask(category, error, changeState, task, maxFailedRetries, failedRetryCount + 1);
    }
  }

  private sendEvent(error: HMSException, category: TFC) {
    let event: AnalyticsEvent;
    switch (category) {
      case TFC.ConnectFailed:
        event = AnalyticsEventFactory.connect(error);
        break;
      case TFC.SignalDisconnect:
        event = AnalyticsEventFactory.disconnect(error);
        break;
      case TFC.PublishIceConnectionFailed:
        event = AnalyticsEventFactory.publish({ error });
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

  private async setTimeoutPromise<T>(task: () => Promise<T>, delay: number): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeoutId = window.setTimeout(async () => {
        try {
          const value: T = await task();
          value && this.retryTaskIds.splice(this.retryTaskIds.indexOf(timeoutId), 1);
          resolve(value);
        } catch (error) {
          reject(error);
        }
      }, delay);

      this.retryTaskIds.push(timeoutId);
    });
  }
}
