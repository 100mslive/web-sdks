import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  HMSReactiveStore,
  HMSStore,
  HMSActions,
  HMSNotification,
  HMSNotifications,
  HMSStatsStore,
  IStoreReadOnly,
  HMSStats,
  HMSStoreWrapper,
} from '@100mslive/hms-video-store';
import create, { EqualityChecker, StateSelector } from 'zustand';
import { HMSContextProviderProps, makeHMSStoreHook, hooksErrorMessage, makeHMSStatsStoreHook } from './store';
import { isBrowser } from '../utils/isBrowser';

export interface IHMSReactStore<S extends HMSStore | HMSStatsStore> extends IStoreReadOnly<S> {
  <U>(selector: StateSelector<S, U>, equalityFn?: EqualityChecker<U>): U;
}
export interface HMSRoomProviderProps {
  actions?: HMSActions;
  store?: HMSStoreWrapper;
  notifications?: HMSNotifications;
  stats?: HMSStats;
  /**
   * if true this will enable webrtc stats collection
   */
  isHMSStatsOn?: boolean;
}

/**
 * only one context is being created currently. This would need to be changed if multiple
 * rooms have to be supported, where every room will have its own context, provider, store and actions.
 */
const HMSContext = createContext<HMSContextProviderProps | null>(null);

let providerProps: HMSContextProviderProps;
/**
 * top level wrapper for using react sdk hooks. This doesn't have any mandatory arguments, if you are already
 * initialising the sdk on your side, you can pass in the primitives from there as well to use hooks for
 * react part of your code.
 * @constructor
 */
export const HMSRoomProvider: React.FC<HMSRoomProviderProps> = ({
  children,
  actions,
  store,
  notifications,
  stats,
  isHMSStatsOn = false,
}) => {
  if (!providerProps) {
    // adding a dummy function for setstate and destroy because zustan'd create expects them
    // to be present but we don't expose them from the store.
    const errFn = () => {
      throw new Error('modifying store is not allowed');
    };
    if (actions && store) {
      providerProps = {
        actions: actions,
        store: create<HMSStore>({
          ...store,
          setState: errFn,
          destroy: errFn,
        }),
      };
      if (notifications) {
        providerProps.notifications = notifications;
      }
      if (stats) {
        providerProps.statsStore = create<HMSStatsStore>({
          getState: stats.getState,
          subscribe: stats.subscribe,
          setState: errFn,
          destroy: errFn,
        });
      }
    } else {
      const hmsReactiveStore = new HMSReactiveStore();
      providerProps = {
        actions: hmsReactiveStore.getActions(),
        store: create<HMSStore>({
          ...hmsReactiveStore.getStore(),
          setState: errFn,
          destroy: errFn,
        }), // convert vanilla store in react hook
        notifications: hmsReactiveStore.getNotifications(),
      };

      if (isHMSStatsOn) {
        const stats = hmsReactiveStore.getStats();
        providerProps.statsStore = create<HMSStatsStore>({
          getState: stats.getState,
          subscribe: stats.subscribe,
          setState: errFn,
          destroy: errFn,
        });
      }
    }
  }

  useEffect(() => {
    if (isBrowser) {
      window.addEventListener('beforeunload', () => providerProps.actions.leave());
      window.addEventListener('onunload', () => providerProps.actions.leave());
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
    const unsubscribe = HMSContextConsumer.notifications.onNotification((notification: HMSNotification) =>
      setNotification(notification),
    );
    return unsubscribe;
  }, [HMSContextConsumer.notifications]);

  return notification;
};

export const useIsHMSStatsOn = () => {
  const HMSContextConsumer = useContext(HMSContext);
  return Boolean(HMSContextConsumer?.statsStore);
};
