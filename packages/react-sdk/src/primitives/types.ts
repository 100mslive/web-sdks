import { EqualityChecker, StateSelector } from 'zustand';
import { HMSStatsStore, HMSStore, IStoreReadOnly } from '@100mslive/hms-video-store';

export interface IHMSReactStore<S extends HMSStore | HMSStatsStore> extends IStoreReadOnly<S> {
  <U>(selector: StateSelector<S, U>, equalityFn?: EqualityChecker<U>): U;
}
