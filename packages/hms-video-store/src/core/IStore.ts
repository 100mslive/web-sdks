import { HMSStore } from './schema';
import { StateSelector, StoreApi, Subscribe } from 'zustand/vanilla';

/**
 * HMS Reactive store can be used to subscribe to different parts of the store using selectors
 * and get a callback when the value changes.
 */
export interface IStore<T extends Object> extends StoreApi<T> {
  /**
   * Get a part of store using a selector which is true at the current point of time.
   *
   * Usage: `store.getState(selectDominantSpeaker);`
   */
  getState: GetState<T>;

  /**
   * Subscribe to a part of store using selectors, whenever the subscribed part changes, the callback
   * is called with both the latest and previous value of the changed part.
   *
   * Usage:
   * ```
   * const onSpeakerUpdate = (speaker, prevSpeaker) => {
   *  console.log("speaker changed from - ", prevSpeaker, ", to - ", speaker);
   * }
   * store.subscribe(onSpeakerUpdate, selectDominantSpeaker);
   * ```
   */
  subscribe: Subscribe<T>;
}

interface GetState<T> {
  (): T;
  <StateSlice>(selector?: StateSelector<HMSStore, StateSlice>): StateSlice;
}

/**
 * HMS store can be used to:
 * - Get a part of the current store or state(getState)
 * - Subscribe to different parts of the store using selectors and execute a callback when the value changes.
 *
 * Both getState and subscribe use selectors to query a part the store.
 *
 *
 * Selectors are functions with HMSStore as an argument and returns a part of the store.
 *
 * **StoreSelector** is a type alias for this type of function.
 *
 * @category Core
 */
export type IStoreReadOnly<T extends Object> = Omit<IStore<T>, 'setState' | 'namedSetState' | 'destroy'>;
