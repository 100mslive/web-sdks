import React, { useContext } from 'react';
import { EqualityChecker, StateSelector } from 'zustand';
import shallow from 'zustand/shallow';
import { HMSActions, HMSNotifications, HMSStatsStore, HMSStore, IStoreReadOnly } from '@100mslive/hms-video-store';
import HMSLogger from '../utils/logger';

export interface IHMSReactStore<S extends HMSStore | HMSStatsStore> extends IStoreReadOnly<S> {
  <U>(selector: StateSelector<S, U>, equalityFn?: EqualityChecker<U>): U;
}

export const hooksErrorMessage = `It seems like you forgot to add your component within a top level HMSRoomProvider, please refer to 100ms react docs(https://www.100ms.live/docs/javascript/v2/how-to-guides/install-the-sdk/integration#react-hooks) to check on the required steps for using this hook. If the provider is present
  at the top level, check the yarn.lock/package-lock.json, if there are multiple versions of @100mslive/react-sdk. Please ensure the versions of @100mslive/react-sdk and @100mslive/roomkit-react are the same versions from the release notes(https://www.100ms.live/docs/javascript/v2/changelog/release-notes) that you are trying to update to.`;

export interface HMSContextProviderProps {
  actions: HMSActions; // for actions which may also mutate store
  store: IHMSReactStore<HMSStore>; // readonly store, don't mutate this
  notifications?: HMSNotifications;
  statsStore?: IHMSReactStore<HMSStatsStore>;
}

export function makeHMSStoreHook(hmsContext: React.Context<HMSContextProviderProps | null>) {
  const useHMSStore = <StateSlice>(
    selector: StateSelector<HMSStore, StateSlice>,
    equalityFn: EqualityChecker<StateSlice> = shallow,
  ) => {
    if (!selector) {
      HMSLogger.w(
        'fetching full store without passing any selector may have a heavy performance impact on your website.',
      );
    }
    const HMSContextConsumer = useContext(hmsContext);
    if (!HMSContextConsumer) {
      throw new Error(hooksErrorMessage);
    }
    const useStore = HMSContextConsumer.store;
    return useStore(selector, equalityFn);
  };
  return useHMSStore;
}

export function makeHMSStatsStoreHook(hmsContext: React.Context<HMSContextProviderProps | null>) {
  const useHMSStatsStore = <StateSlice>(
    selector: StateSelector<HMSStatsStore, StateSlice>,
    equalityFn: EqualityChecker<StateSlice> = shallow,
  ) => {
    if (!selector) {
      HMSLogger.w(
        'fetching full store without passing any selector may have a heavy performance impact on your website.',
      );
    }
    const HMSContextConsumer = useContext(hmsContext);
    if (!HMSContextConsumer) {
      throw new Error(hooksErrorMessage);
    }
    const useStore = HMSContextConsumer.statsStore;
    return useStore?.(selector, equalityFn);
  };
  return useHMSStatsStore;
}
