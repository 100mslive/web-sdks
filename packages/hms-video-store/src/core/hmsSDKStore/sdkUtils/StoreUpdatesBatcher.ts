import { HMSStore } from '../../schema';
import { IHMSStore } from '../../IHMSStore';
import { HMSLogger } from '../../../common/ui-logger';
import { NamedSetStateAsync } from '../internalTypes';
import { PartialState } from 'zustand/vanilla';
import { highFrequencyUpdates } from '../HMSSDKActions';

/**
 * pass in an action and an update function, the update functions will be batched and run such that
 * store updates are limited to only one action in a time interval.
 * Ensure the order in which updates are applied.
 */
export class StoreUpdatesBatcher {
  private TAG = 'StoreUpdatesBatcher';
  private queuedActions: Map<string, number> = new Map();
  private queuedUpdates: PartialState<any>[] = [];
  private nextUpdatePromise?: Promise<void>;
  private DEFAULT_INTERVAL_MS = 5;
  private store: IHMSStore;

  constructor(store: IHMSStore) {
    this.store = store;
  }

  setState: NamedSetStateAsync<HMSStore> = async (fn, action) => {
    if (action) {
      const currCount = this.queuedActions.get(action) || 0;
      this.queuedActions.set(action, 1 + currCount);
    }
    this.queuedUpdates.push(fn);
    if (!this.nextUpdatePromise) {
      // there is no schedule update, schedule an update and create a promise
      this.nextUpdatePromise = new Promise<void>(resolve => {
        setTimeout(() => {
          this.setStateBatched();
          resolve();
        }, this.DEFAULT_INTERVAL_MS);
      });
    }
    return this.nextUpdatePromise;
  };

  private setStateBatched() {
    if (this.queuedUpdates?.length > 0) {
      const action = Array.from(this.queuedActions, ([action, count]) => `${count}-${action}`).join(';');
      const start = performance.now();
      let timeDiffFnsRun = 0;
      const batchedFn = (draftStore: HMSStore) => {
        this.queuedUpdates.forEach(fn => {
          try {
            fn(draftStore);
          } catch (err) {
            HMSLogger.w(this.TAG, 'failed to update store', err, fn.name);
          }
        });
        timeDiffFnsRun = performance.now() - start;
      };
      this.store.namedSetState(batchedFn, `batched-${action}`);
      const timeDiffSetState = performance.now() - start;
      if (this.shouldLog(timeDiffSetState)) {
        HMSLogger.d(
          this.TAG,
          `timeDiffSetState=${timeDiffSetState.toFixed(2)}ms, timeDiffFnsRun=${timeDiffFnsRun.toFixed(
            2,
          )}ms, renderTime=${(timeDiffSetState - timeDiffFnsRun).toFixed(2)}ms, actions="${action}"`,
        );
      }
    }
    // cleanup
    this.queuedUpdates = [];
    this.queuedActions.clear();
    this.nextUpdatePromise = undefined;
  }

  /**
   * when timeDiff is small,
   * don't log if only one action was queued and that was blacklisted
   */
  private shouldLog(timeDiffMs: number) {
    if (timeDiffMs > 100) {
      return true;
    }
    if (this.queuedActions.size === 1) {
      for (const action of highFrequencyUpdates) {
        if (this.queuedActions.has(action)) {
          return false;
        }
      }
    }
    return true;
  }
}
