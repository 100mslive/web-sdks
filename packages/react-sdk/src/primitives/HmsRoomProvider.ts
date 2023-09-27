import React, { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';
import create from 'zustand';
import {
  HMSActions,
  HMSGenericTypes,
  HMSNotificationInCallback,
  HMSNotifications,
  HMSNotificationTypeParam,
  HMSReactiveStore,
  HMSStatsStore,
  HMSStatsStoreWrapper,
  HMSStore,
  HMSStoreWrapper,
} from '@100mslive/hms-video-store';
import { HMSContextProviderProps, hooksErrorMessage, makeHMSStatsStoreHook, makeHMSStoreHook } from './store';
import { isBrowser } from '../utils/isBrowser';

export interface HMSRoomProviderProps<T extends HMSGenericTypes> {
  actions?: HMSActions<T>;
  store?: HMSStoreWrapper<T>;
  notifications?: HMSNotifications;
  stats?: HMSStatsStoreWrapper;
  /**
   * if true this will enable webrtc stats collection
   */
  isHMSStatsOn?: boolean;
  leaveOnUnload?: boolean;
}

/**
 * only one context is being created currently. This would need to be changed if multiple
 * rooms have to be supported, where every room will have its own context, provider, store and actions.
 */
const HMSContext = createContext<HMSContextProviderProps | null>(null);

/**
 * top level wrapper for using react sdk hooks. This doesn't have any mandatory arguments, if you are already
 * initialising the sdk on your side, you can pass in the primitives from there as well to use hooks for
 * react part of your code.
 * @constructor
 */
// eslint-disable-next-line complexity
export const HMSRoomProvider = <T extends HMSGenericTypes = { sessionStore: Record<string, any> }>({
  children,
  actions,
  store,
  notifications,
  stats,
  isHMSStatsOn = false,
  leaveOnUnload = true,
}: PropsWithChildren<HMSRoomProviderProps<T>>) => {
  const providerProps: HMSContextProviderProps = useMemo(() => {
    let providerProps: HMSContextProviderProps;
    // adding a dummy function for setstate and destroy because zustan'd create expects them
    // to be present but we don't expose them from the store.
    const errFn = () => {
      throw new Error('modifying store is not allowed');
    };
    if (actions && store) {
      providerProps = {
        actions: actions,
        store: create<HMSStore<T>>({
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
      const hmsReactiveStore = new HMSReactiveStore<T>();
      providerProps = {
        actions: hmsReactiveStore.getActions(),
        store: create<HMSStore<T>>({
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

    // @ts-ignore
    providerProps.actions.setFrameworkInfo({
      type: 'react-web',
      version: React.version,
      sdkVersion: process.env.REACT_SDK_VERSION,
    });

    return providerProps;
  }, [actions, store, notifications, stats, isHMSStatsOn]);

  useEffect(() => {
    if (isBrowser && leaveOnUnload) {
      const unloadCallback = () => providerProps.actions.leave();
      window.addEventListener('unload', unloadCallback);
      return () => {
        window.removeEventListener('unload', unloadCallback);
      };
    }

    return () => {};
  }, [leaveOnUnload, providerProps]);

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
 * `useHMSVanillaNotifications` returns the vanilla HMSNotifications object. This makes it a bit easier to ensure
 * a notification is processed only once in your components. The other way is to use the hook version and put
 * the component high enough in the chain.
 * Usage:
 * ```
 * useEffect(() => {
 *   const unsub = notifications.onNotification((notification) => {
 *     console.log(notification);
 *   }, notificationType);
 *   return unsub;
 * }, [])
 * ```
 */
export const useHMSVanillaNotifications = () => {
  const HMSContextConsumer = useContext(HMSContext);
  if (!HMSContextConsumer) {
    throw new Error(hooksErrorMessage);
  }
  return HMSContextConsumer.notifications;
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
 * @param type can be a string or an array of string for the types of notifications to listen to. If an array is passed
 * either declare it outside the functional component or use a useMemo to make sure its reference stays same across
 * rerenders for performance reasons.
 */
export const useHMSNotifications = <T extends HMSNotificationTypeParam>(
  type?: T,
): HMSNotificationInCallback<T> | null => {
  const HMSContextConsumer = useContext(HMSContext);
  const [notification, setNotification] = useState<HMSNotificationInCallback<T> | null>(null);

  if (!HMSContextConsumer) {
    throw new Error(hooksErrorMessage);
  }

  useEffect(() => {
    if (!HMSContextConsumer.notifications) {
      return;
    }
    const unsubscribe = HMSContextConsumer.notifications.onNotification<T>(notification => {
      setNotification(notification);
    }, type);
    return unsubscribe;
  }, [HMSContextConsumer.notifications, type]);

  return notification;
};

export const useIsHMSStatsOn = () => {
  const HMSContextConsumer = useContext(HMSContext);
  return Boolean(HMSContextConsumer?.statsStore);
};
