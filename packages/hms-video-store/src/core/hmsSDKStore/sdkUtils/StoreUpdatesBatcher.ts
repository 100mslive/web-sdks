import { HMSStore } from '../../schema';
import { IHMSStore } from '../../IHMSStore';
import { HMSLogger } from '../../../common/ui-logger';
import { NamedSetState } from '../internalTypes';
import { PartialState } from 'zustand/vanilla';

/**
 * pass in an action and an update function, the update functions will be batched and run such that
 * store updates are limited to only one action in a time interval
 *
 */
export class StoreUpdatesBatcher {
  private queuedUpdates: PartialState<any>[] = [];
  private timer?: any;
  private DEFAULT_INTERVAL_MS = 500;
  private store: IHMSStore;
  private actionNames: Set<string> = new Set<string>();
  constructor(store: IHMSStore) {
    this.store = store;
  }

  setState: NamedSetState<HMSStore> = (fn, action) => {
    if (action && !['audioLevel', 'playlistProgress', 'connectionQuality'].includes(action)) {
      HMSLogger.d(`batching ${action} for update`);
    }
    this.actionNames.add(action || '');
    this.queuedUpdates.push(fn);
    if (this.timer) {
      return;
    }
    // set a future timeout if a timer is not there already
    this.timer = setTimeout(() => this.setStateBatched(), this.DEFAULT_INTERVAL_MS);
  };

  private setStateBatched() {
    if (this.queuedUpdates?.length > 0) {
      const batchedFn = (draftStore: HMSStore) => {
        this.queuedUpdates.forEach(fn => {
          try {
            fn(draftStore);
          } catch (err) {
            HMSLogger.w('failed to update store', err, fn.name);
          }
        });
      };
      const start = performance.now();
      const action = Array.from(this.actionNames).join(';');
      this.store.namedSetState(batchedFn, `batched-${action}`);
      const timeDiff = performance.now() - start;
      if (timeDiff > 0) {
        HMSLogger.d('BatchedSetState', `time taken in setState ${timeDiff}ms`, action);
      }
    }
    // cleanup
    this.queuedUpdates = [];
    this.actionNames.clear();
    clearTimeout(this.timer);
    this.timer = undefined;
  }
}
