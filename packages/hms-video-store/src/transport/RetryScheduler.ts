import { Dependencies as TFCDependencies, TransportFailureCategory as TFC } from './models/TransportFailureCategory';
import { TransportState } from './models/TransportState';
import { HMSException } from '../error/HMSException';
import { MAX_TRANSPORT_RETRIES, MAX_TRANSPORT_RETRY_DELAY } from '../utils/constants';
import HMSLogger from '../utils/logger';
import { PromiseWithCallbacks } from '../utils/promise';

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

interface ScheduleTaskParams {
  category: TFC;
  error: HMSException;
  task: RetryTask;
  originalState: TransportState;
  maxFailedRetries?: number;
  changeState?: boolean;
}

export class RetryScheduler {
  private readonly TAG = '[RetryScheduler]';
  private inProgress = new Map<TFC, PromiseWithCallbacks<number>>();
  private retryTaskIds: number[] = [];

  constructor(
    private onStateChange: (state: TransportState, error?: HMSException) => Promise<void>,
    private sendEvent: (error: HMSException, category: TFC) => void,
  ) {}

  async schedule({
    category,
    error,
    task,
    originalState,
    maxFailedRetries = MAX_TRANSPORT_RETRIES,
    changeState = true,
  }: ScheduleTaskParams) {
    await this.scheduleTask({ category, error, changeState, task, originalState, maxFailedRetries });
  }

  reset() {
    this.retryTaskIds.forEach(future => clearTimeout(future));
    this.retryTaskIds = [];
    this.inProgress.clear();
  }

  isTaskInProgress(category: TFC) {
    return !!this.inProgress.get(category);
  }

  // eslint-disable-next-line complexity
  private async scheduleTask({
    category,
    error,
    changeState,
    task,
    originalState,
    maxFailedRetries = MAX_TRANSPORT_RETRIES,
    failedRetryCount = 0,
  }: ScheduleTaskParams & { failedRetryCount?: number }): Promise<void> {
    HMSLogger.d(this.TAG, 'schedule: ', { category: TFC[category], error });

    // First schedule call
    if (failedRetryCount === 0) {
      const inProgressTask = this.inProgress.get(category);
      if (inProgressTask) {
        HMSLogger.d(this.TAG, `schedule: Already a task for ${TFC[category]} scheduled, waiting for its completion`);
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
            this.TAG,
            `schedule: Suspending retry task of ${TFC[category]}, waiting for ${TFC[dependency]} to recover`,
          );
          await dependencyTask.promise;
          HMSLogger.d(
            this.TAG,
            `schedule: Resuming retry task ${TFC[category]} as it's dependency ${TFC[dependency]} is recovered`,
          );
        }
      } catch (ex) {
        HMSLogger.d(
          this.TAG,
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

    const delay = this.getDelayForRetryCount(category, failedRetryCount);

    HMSLogger.d(
      this.TAG,
      `schedule: [${TFC[category]}] [failedRetryCount=${failedRetryCount}] Scheduling retry task in ${delay}ms`,
    );

    let taskSucceeded: boolean;
    try {
      taskSucceeded = await this.setTimeoutPromise(task, delay);
    } catch (ex) {
      taskSucceeded = false;
      HMSLogger.w(
        this.TAG,
        `[${TFC[category]}] Un-caught exception ${(ex as HMSException).name} in retry-task, initiating retry`,
        ex,
      );
    }

    if (taskSucceeded) {
      const taskPromise = this.inProgress.get(category);
      this.inProgress.delete(category);
      taskPromise?.resolve(failedRetryCount);

      if (changeState && this.inProgress.size === 0) {
        this.onStateChange(originalState);
      }
      HMSLogger.d(this.TAG, `schedule: [${TFC[category]}] [failedRetryCount=${failedRetryCount}] Recovered ♻️`);
    } else {
      await this.scheduleTask({
        category,
        error,
        changeState,
        task,
        originalState,
        maxFailedRetries,
        failedRetryCount: failedRetryCount + 1,
      });
    }
  }

  private getBaseDelayForTask(category: TFC, n: number) {
    if (category === TFC.JoinWSMessageFailed) {
      // linear backoff(2 + jitter for every retry)
      return 2;
    }
    // exponential backoff
    return Math.pow(2, n);
  }

  private getDelayForRetryCount(category: TFC, n: number) {
    const delay = this.getBaseDelayForTask(category, n);
    const jitter = category === TFC.JoinWSMessageFailed ? Math.random() * 2 : Math.random();
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
