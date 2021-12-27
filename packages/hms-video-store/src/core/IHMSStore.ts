import { HMSStore, HMSStatsStore } from './schema';
import { StateSelector, StoreApi, Subscribe, State } from 'zustand/vanilla';
import { NamedSetState } from './hmsSDKStore/internalTypes';

/**
 * HMS Reactive store can be used to subscribe to different parts of the store using selectors
 * and get a callback when the value changes.
 */
export interface IStore<T extends State> extends StoreApi<T> {
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

  /**
   * @private
   * @internal
   * @privateRemarks
   * wraps setState to take an additional action name parameter which can show up in redux devtools.
   */
  namedSetState: NamedSetState<T>;
}

export interface GetState<T extends State> {
  (): T;
  <StateSlice>(selector?: StateSelector<T, StateSlice>): StateSlice;
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
export type IStoreReadOnly<T extends State> = Omit<IStore<T>, 'setState' | 'namedSetState' | 'destroy'>;

/**
 * HMS Reactive store can be used to subscribe to different parts of the store using selectors
 * and get a callback when the value changes.
 */
export type IHMSStore = IStore<HMSStore>;

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
export type IHMSStoreReadOnly = IStoreReadOnly<HMSStore>;

export type IHMSStatsStore = IStore<HMSStatsStore>;
export type IHMSStatsStoreReadOnly = IStoreReadOnly<HMSStatsStore>;
