import { HMSStore } from './schema';
import { StateSelector, StoreApi, Subscribe } from 'zustand/vanilla';
import { NamedSetState } from './hmsSDKStore/internalTypes';

/**
 * HMS Reactive store can be used to subscribe to different parts of the store using selectors
 * and get a callback when the value changes.
 */
export interface IHMSStore extends StoreApi<HMSStore> {
  /**
   * Get a part of store using a selector which is true at the current point of time
   */
  getState: GetState<HMSStore>;

  /**
   * Subscribe to a part of store using selectors, whenever the subscribed part changes, the callback
   * is notified with both the latest and previous value of the changed part
   */
  subscribe: Subscribe<HMSStore>;

  /**
   * @private
   * @internal
   * @privateRemarks
   * wraps setState to take an additional action name parameter which can show up in redux devtools.
   */
  namedSetState: NamedSetState<HMSStore>;
}

interface GetState<T> {
  (): T;
  <StateSlice>(selector?: StateSelector<HMSStore, StateSlice>): StateSlice;
}

/**
 * HMS store can be used to subscribe to different parts of the store using selectors
 * and get a callback when the value changes.
 */
export type IHMSStoreReadOnly = Omit<IHMSStore, 'setState' | 'namedSetState' | 'destroy'>;
