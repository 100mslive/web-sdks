import { HMSGenericTypes, HMSStore } from '../schema';

type byKeySelector<
  T extends HMSGenericTypes = { appData?: any; sessionStore?: any },
  S = HMSStore<T>,
  K extends keyof T['sessionStore'] = keyof T['sessionStore'],
> = (store: S, key?: K) => T['sessionStore'][K] | T['sessionStore'] | undefined;

/**
 * StoreSelector is a function that takes in {@link HMSStore} as argument
 * and returns a part of the store that is queried using the selector.
 * @typeParam T Part of the store that you wish to query.
 */
export type StoreSelector<
  T extends HMSGenericTypes = { appData?: any; sessionStore?: any },
  S = HMSStore<T>,
  K extends keyof T['sessionStore'] = keyof T['sessionStore'],
> = (store: S) => T['sessionStore'][K] | T['sessionStore'] | undefined;

/**
 * takes in a normal selector which has store and id as input and curries it to make it easier to use.
 * Before: store.getState((store) => normalSelector(store, peerID))
 * After: store.getState(curriedSelector(peerID))
 */
export function byKeyCurry<
  T extends HMSGenericTypes = { appData?: any; sessionStore?: any },
  S = HMSStore<T>,
  K extends T['sessionStore'] = keyof T['sessionStore'],
>(selector: byKeySelector<T, S, K>): (key?: K) => StoreSelector<T, S, K> {
  return (key?: K) => {
    return (store: S) => selector(store, key);
  };
}
