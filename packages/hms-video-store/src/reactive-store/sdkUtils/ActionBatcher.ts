import { HMSLogger } from '../../common/ui-logger';
import { IHMSStore } from '../../IHMSStore';
import { HMSGenericTypes, HMSStore } from '../../schema';

type ActionName = string;
type SetTimeOutId = number;
type SetState = (store: HMSStore) => void;

/**
 * pass in an action and an update function, the update functions will be batched and run such that
 * store updates are limited to only one action in a time interval
 *
 */
export class ActionBatcher<T extends HMSGenericTypes = { sessionStore: Record<string, any> }> {
  private queuedUpdates: Record<ActionName, SetState[]> = {};
  private timers: Record<ActionName, SetTimeOutId> = {};
  private DEFAULT_INTERVAL_MS = 50;
  private store: IHMSStore<T>;
  constructor(store: IHMSStore<T>) {
    this.store = store;
  }

  setState(fn: SetState, action: ActionName, timeout = this.DEFAULT_INTERVAL_MS) {
    this.queuedUpdates[action] = this.queuedUpdates[action] || [];
    this.queuedUpdates[action].push(fn);
    if (this.timers[action]) {
      return;
    }
    // set a future timeout if a timer is not there already
    if (window) {
      this.timers[action] = window.setTimeout(() => this.setStateBatched(action), timeout);
    } else {
      // nodejs, ignore batching for now
      this.setStateBatched(action);
    }
  }

  private setStateBatched(action: ActionName) {
    if (this.queuedUpdates[action]?.length > 0) {
      const batchedFn = (draftStore: HMSStore) => {
        this.queuedUpdates[action].forEach(fn => {
          try {
            fn(draftStore);
          } catch (err) {
            HMSLogger.w('failed to update store', err);
          }
        });
      };
      console.time(`timed-${action}`);
      this.store.namedSetState(batchedFn, action);
      console.timeEnd(`timed-${action}`);
    }
    // cleanup
    delete this.queuedUpdates[action];
    if (window && this.timers[action]) {
      window.clearTimeout(this.timers[action]);
      delete this.timers[action];
    }
  }
}
