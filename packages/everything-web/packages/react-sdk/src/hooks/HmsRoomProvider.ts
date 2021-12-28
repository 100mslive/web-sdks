import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    HMSReactiveStore,
    HMSStore,
    HMSActions,
    HMSNotification,
    HMSNotifications,
    HMSStatsStore,
    HMSStats,
    HMSStoreWrapper
} from '@100mslive/hms-video-store';
import create from 'zustand';
import {
    HMSContextProviderProps,
    makeHMSStoreHook,
    hooksErrorMessage,
    makeHMSStatsStoreHook
} from './store';
import { isBrowser } from '../utils/isBrowser';

export interface HMSRoomProviderProps {
    actions?: HMSActions;
    store?: HMSStoreWrapper;
    notifications?: HMSNotifications;
    webrtcInternals?: HMSStats;
    isHMSStatsOn?: boolean;
}

/**
 * only one context is being created currently. This would need to be changed if multiple
 * rooms have to be supported, where every room will have its own context, provider, store and actions.
 */
const HMSContext = createContext<HMSContextProviderProps | null>(null);

let providerProps: HMSContextProviderProps;
export const HMSRoomProvider: React.FC<HMSRoomProviderProps> = ({
    children,
    actions,
    store,
    notifications,
    webrtcInternals,
    isHMSStatsOn = false
}) => {
    if (!providerProps) {
        // adding a dummy function for setstate and destroy because zustan'd create expects them
        // to be present but we don't expose them from the store.
        const errFn = () => {
            throw new Error('modifying store is not allowed');
        };
        if (actions && store) {
            providerProps = {
                actions,
                store: create({
                    ...store,
                    setState: errFn,
                    destroy: errFn
                })
            };
            if (notifications) {
                providerProps.notifications = notifications;
            }
            if (webrtcInternals) {
                const hmsInternals = webrtcInternals;
                providerProps.statsStore = create<HMSStatsStore>({
                    getState: hmsInternals.getState,
                    subscribe: hmsInternals.subscribe,
                    setState: errFn,
                    destroy: errFn
                });
            }
        } else {
            const hmsReactiveStore = new HMSReactiveStore();

            providerProps = {
                actions: hmsReactiveStore.getHMSActions(),
                store: create<HMSStore>({
                    ...hmsReactiveStore.getStore(),
                    setState: errFn,
                    destroy: errFn
                }), // convert vanilla store in react hook
                notifications: hmsReactiveStore.getNotifications()
            };

            if (isHMSStatsOn) {
                const hmsInternals = hmsReactiveStore.getStats();
                providerProps.statsStore = create<HMSStatsStore>({
                    getState: hmsInternals.getState,
                    subscribe: hmsInternals.subscribe,
                    setState: errFn,
                    destroy: errFn
                });
            }
        }
    }
    useEffect(() => {
        if (isBrowser) {
            window.onunload = () => {
                providerProps.actions.leave();
            };
        }
    }, []);

    return React.createElement(HMSContext.Provider, { value: providerProps }, children);
};

/**
 * `useHMSStore` is a read only hook which can be passed a selector to read data.
 * The hook can only be used in a component if HMSRoomProvider is present in its ancestors.
 */
export const useHMSStore = makeHMSStoreHook(HMSContext);

export const useHMSStatsStore = makeHMSStatsStoreHook(HMSContext);

/**
 * `useHMSVanillaStore` is a read only hook which returns the vanilla HMSStore.
 * Usage:
 * ```
 * const hmsStore = useHMSVanillaStore();
 * const dominantSpeaker = hmsStore.getState(selectDominantSpeaker);
 * ```
 *
 * Note: There's no need to use the vanilla hmsStore in React components.
 * This is used in rare cases where the store needs to be accessed outside a React component.
 * For almost every case, `useHMSStore` would get the job done.
 */
export const useHMSVanillaStore = () => {
    const HMSContextConsumer = useContext(HMSContext);
    if (!HMSContextConsumer) {
        throw new Error(hooksErrorMessage);
    }

    return HMSContextConsumer.store;
};

/*
 * `useHMSActions` is a write only hook which can be used to dispatch actions.
 */
export const useHMSActions = () => {
    const HMSContextConsumer = useContext(HMSContext);
    if (!HMSContextConsumer) {
        throw new Error(hooksErrorMessage);
    }
    return HMSContextConsumer.actions;
};

/**
 * `useHMSNotifications` is a read only hook which gives the latest notification(HMSNotification) received.
 */
export const useHMSNotifications = () => {
    const HMSContextConsumer = useContext(HMSContext);
    const [notification, setNotification] = useState<HMSNotification | null>(null);

    if (!HMSContextConsumer) {
        throw new Error(hooksErrorMessage);
    }

    useEffect(() => {
        if (!HMSContextConsumer.notifications) {
            return;
        }
        const unsubscribe = HMSContextConsumer.notifications.onNotification(
            // eslint-disable-next-line @typescript-eslint/no-shadow
            (notification: HMSNotification) => setNotification(notification)
        );
        // eslint-disable-next-line consistent-return
        return unsubscribe;
    }, [HMSContextConsumer.notifications]);

    return notification;
};
