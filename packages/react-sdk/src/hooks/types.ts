import { EqualityChecker, StateSelector } from 'zustand';
import { HMSStore, IStoreReadOnly, HMSStatsStore } from '@100mslive/hms-video-store';

export interface IHMSReactStore<S extends HMSStore | HMSStatsStore> extends IStoreReadOnly<S> {
  <U>(selector: StateSelector<S, U>, equalityFn?: EqualityChecker<U>): U;
}

/**
 * use this to control how errors are handled within a function exposed by a hook. By default this
 * only logs the error to the console, and can be overridden for any other behaviour. For e.g.
 * `(err) => throw err;` will ensure that any error is thrown back to the caller when the function is called.
 */
export type hooksErrHandler = (err: Error, method?: string) => void;
