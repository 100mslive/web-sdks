import { Dependencies as TFCDependencies, TransportFailureCategory as TFC } from './models/TransportFailureCategory';
import { TransportState } from './models/TransportState';
import { HMSException } from '../error/HMSException';
import { MAX_TRANSPORT_RETRY_TIME } from '../utils/constants';
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
  maxRetryTime?: number;
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
    maxRetryTime = MAX_TRANSPORT_RETRY_TIME,
    changeState = true,
  }: ScheduleTaskParams) {
    await this.scheduleTask({ category, error, changeState, task, originalState, maxRetryTime, failedAt: Date.now() });
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
    failedAt,
    maxRetryTime = MAX_TRANSPORT_RETRY_TIME,
    failedRetryCount = 0,
  }: ScheduleTaskParams & { failedAt: number; failedRetryCount?: number }): Promise<void> {
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

    const handleTerminalError = (error: HMSException) => {
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
    };

    const timeElapsedSinceError = Date.now() - failedAt;
    if (timeElapsedSinceError >= maxRetryTime || hasFailedDependency) {
      error.description += `. [${TFC[category]}] Could not recover after ${timeElapsedSinceError} milliseconds`;

      if (hasFailedDependency) {
        error.description += ` Could not recover all of it's required dependencies - [${(dependencies as Array<TFC>)
          .map(dep => TFC[dep])
          .toString()}]`;
      }
      error.isTerminal = true;
      return handleTerminalError(error);
    }

    if (changeState) {
      this.onStateChange(TransportState.Reconnecting, error);
    }

    const delay = this.getDelayForRetryCount(category);

    HMSLogger.d(
      this.TAG,
      `schedule: [${TFC[category]}] [failedRetryCount=${failedRetryCount}] Scheduling retry task in ${delay}ms`,
    );

    let taskSucceeded: boolean;
    try {
      taskSucceeded = await this.setTimeoutPromise(task, delay);
    } catch (ex) {
      taskSucceeded = false;
      const error = ex as HMSException;

      if (error.isTerminal) {
        HMSLogger.e(this.TAG, `[${TFC[category]}] Un-caught terminal exception ${error.name} in retry-task`, ex);
        return handleTerminalError(error);
      } else {
        HMSLogger.w(
          this.TAG,
          `[${TFC[category]}] Un-caught exception ${error.name} in retry-task, initiating retry`,
          ex,
        );
      }
    }

    if (taskSucceeded) {
      const taskPromise = this.inProgress.get(category);
      this.inProgress.delete(category);
      taskPromise?.resolve(failedRetryCount);

      if (changeState && this.inProgress.size === 0) {
        this.onStateChange(originalState);
      }
      HMSLogger.d(
        this.TAG,
        `schedule: [${TFC[category]}] [failedRetryCount=${failedRetryCount}] Recovered ♻️ after ${timeElapsedSinceError}ms`,
      );
    } else {
      await this.scheduleTask({
        category,
        error,
        changeState,
        task,
        originalState,
        maxRetryTime,
        failedAt,
        failedRetryCount: failedRetryCount + 1,
      });
    }
  }

  private getDelayForRetryCount(category: TFC) {
    const jitter = category === TFC.JoinWSMessageFailed ? Math.random() * 2 : Math.random();
    let delaySeconds = 0;
    if (category === TFC.JoinWSMessageFailed) {
      // linear backoff(2 + jitter for every retry)
      delaySeconds = 2 + jitter;
    } else if (category === TFC.SignalDisconnect) {
      delaySeconds = 1;
    }
    return delaySeconds * 1000;
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
