/* eslint-disable @typescript-eslint/no-empty-interface */

/**
 * Disabling this lint option so that
 * IHMSStore, IHMSStoreReadOnly, IHMSStatsStore, IHMSStatsStoreReadOnly
 * are exported as interfaces to include tsdoc comments with them.
 */

import { State, StateSelector, StoreApi, Subscribe } from 'zustand/vanilla';
import { NamedSetState } from './reactive-store/internalTypes';
import { HMSGenericTypes, HMSStatsStore, HMSStore } from './schema';

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
 * @internal
 */
export type IStoreReadOnly<T extends State> = Omit<IStore<T>, 'setState' | 'namedSetState' | 'destroy'>;

/**
 * HMS Reactive store can be used to subscribe to different parts of the store using selectors
 * and get a callback when the value changes.
 */
export interface IHMSStore<T extends HMSGenericTypes = { sessionStore: Record<string, any> }>
  extends IStore<HMSStore<T>> {}

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
export interface IHMSStoreReadOnly<T extends HMSGenericTypes = { sessionStore: Record<string, any> }>
  extends IStoreReadOnly<HMSStore<T>> {}

export interface IHMSStatsStore extends IStore<HMSStatsStore> {}
export interface IHMSStatsStoreReadOnly extends IStoreReadOnly<HMSStatsStore> {}
