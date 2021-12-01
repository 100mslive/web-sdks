import { EqualityChecker, StateSelector } from 'zustand';
import {
  HMSStore,
  HMSStoreWrapper
} from '@100mslive/hms-video-store';

export interface IHMSReactStore extends HMSStoreWrapper {
  <U>(selector: StateSelector<HMSStore, U>, equalityFn?: EqualityChecker<U>): U;
}