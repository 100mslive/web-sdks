import { EqualityChecker, StateSelector } from 'zustand';
import { HMSStore, IStoreReadOnly, HMSStatsStore } from '@100mslive/hms-video-store';

export interface IHMSReactStore<S extends HMSStore | HMSStatsStore> extends IStoreReadOnly<S> {
  <U>(selector: StateSelector<S, U>, equalityFn?: EqualityChecker<U>): U;
}
