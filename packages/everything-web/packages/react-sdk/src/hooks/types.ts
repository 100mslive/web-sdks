import { EqualityChecker, StateSelector } from 'zustand';
import { HMSStore, IStoreReadOnly, HMSInternalsStore } from '@100mslive/hms-video-store';

export interface IHMSReactStore<S extends HMSStore | HMSInternalsStore> extends IStoreReadOnly<S> {
    <U>(selector: StateSelector<S, U>, equalityFn?: EqualityChecker<U>): U;
}
