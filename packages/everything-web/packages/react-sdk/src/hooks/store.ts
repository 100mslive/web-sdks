import { EqualityChecker, StateSelector } from 'zustand';
import React, { useContext } from 'react';
import shallow from 'zustand/shallow';
import {
    HMSActions,
    HMSStore,
    HMSNotifications,
    HMSInternalsStore,
    HMSWebrtcInternals
} from '@100mslive/hms-video-store';
import HMSLogger from '../utils/logger';
import { IHMSReactStore } from './types';

export const hooksErrorMessage =
    'It seems like you forgot to add your component within a top level HMSRoomProvider, please refer to 100ms react docs(https://docs.100ms.live/javascript/v2/features/integration#react-hooks) to check on the required steps for using this hook.';

export interface HMSContextProviderProps {
    actions: HMSActions; // for actions which may also mutate store
    store: IHMSReactStore<HMSStore>; // readonly store, don't mutate this
    notifications?: HMSNotifications;
    statsStore?: IHMSReactStore<HMSInternalsStore>;
    hmsInternals?: HMSWebrtcInternals;
}

export function makeHMSStoreHook(hmsContext: React.Context<HMSContextProviderProps | null>) {
    const useHMSStore = <StateSlice>(
        selector: StateSelector<HMSStore, StateSlice>,
        equalityFn: EqualityChecker<StateSlice> = shallow
    ) => {
        if (!selector) {
            HMSLogger.w(
                'fetching full store without passing any selector may have a heavy performance impact on your website.'
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
    const useHMSStore = <StateSlice>(
        selector: StateSelector<HMSInternalsStore, StateSlice>,
        equalityFn: EqualityChecker<StateSlice> = shallow
    ) => {
        if (!selector) {
            HMSLogger.w(
                'fetching full store without passing any selector may have a heavy performance impact on your website.'
            );
        }
        const HMSContextConsumer = useContext(hmsContext);
        if (!HMSContextConsumer) {
            throw new Error(hooksErrorMessage);
        }
        const useStore = HMSContextConsumer.statsStore;
        return useStore?.(selector, equalityFn);
    };
    return useHMSStore;
}
