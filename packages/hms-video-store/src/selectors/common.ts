import { HMSStatsStore, HMSStore } from '../schema';

export type StoreTypes = HMSStore | HMSStatsStore;

type byIDSelector<S extends StoreTypes, T> = (store: S, id?: string) => T;

/**
 * StoreSelector is a function that takes in {@link HMSStore} as argument
 * and returns a part of the store that is queried using the selector.
 * @typeParam T Part of the store that you wish to query.
 */
export type StoreSelector<S extends StoreTypes, T> = (store: S) => T;

/**
 * takes in a normal selector which has store and id as input and curries it to make it easier to use.
 * Before: store.getState((store) => normalSelector(store, peerID))
 * After: store.getState(curriedSelector(peerID))
 */
export function byIDCurry<S extends StoreTypes, T>(selector: byIDSelector<S, T>): (id?: string) => StoreSelector<S, T> {
  return (id?: string) => {
    return (store: S) => selector(store, id);
  };
}
