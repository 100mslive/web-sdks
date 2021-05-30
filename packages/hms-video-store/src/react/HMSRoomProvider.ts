import React, { createContext, useContext } from 'react';
import { HMSReactiveStore, HMSStore, IHMSActions, IHMSStore } from '../core';
import { IHMSStoreReadOnly } from '../core/IHMSStore';
import { EqualityChecker, StateSelector } from 'zustand';
import shallow from 'zustand/shallow';
import { HMSLogger } from '../common/ui-logger';

interface HMSContextProviderProps {
  actions: IHMSActions; // for actions which may also mutate store
  store: IHMSStoreReadOnly; // readonly store, don't mutate this
}

export interface HMSRoomProviderProps {
  actions?: IHMSActions;
  store?: IHMSStoreReadOnly;
}

/**
 * only one context is being created currently. This would need to be changed if multiple
 * rooms have to be supported, where every room will have its own context, provider, store and actions.
 */
const HMSContext = createContext<HMSContextProviderProps | null>(null);

let providerProps: HMSContextProviderProps;
export const HMSRoomProvider: React.FC<HMSRoomProviderProps> = ({ children, ...props }) => {
  if (!providerProps) {
    if (props.actions && props.store) {
      providerProps = { actions: props.actions, store: props.store };
    } else {
      const hmsReactiveStore = new HMSReactiveStore();
      providerProps = {
        actions: hmsReactiveStore.getHMSActions(),
        store: hmsReactiveStore.getStore(),
      };
    }
  }
  window.onunload = () => {
    providerProps.actions.leave();
  };

  return React.createElement(HMSContext.Provider, { value: providerProps }, children);
};

/*
UseHMSStore is a read only hook which can be passed a selector to read data.
The hook can only be used in a component if HMSRoomProvider is present in its ancestors.
 */
export const useHMSStore = () => {
  const useHMSStore = <StateSlice>(
    selector: StateSelector<HMSStore, StateSlice>,
    equalityFn: EqualityChecker<StateSlice> = shallow,
  ) => {
    if (!selector) {
      HMSLogger.w(
        'fetching full store without passing any selector may have a heavy performance impact on your website.',
      );
    }
    const HMSContextConsumer = useContext(HMSContext);
    if (!HMSContextConsumer) {
      throw new Error('HMSContext state variables are not set');
    }
    const useStore = HMSContextConsumer.store as IHMSStore;
    return useStore(selector, equalityFn);
  };
  return useHMSStore;
};

/*
UseHMSActions is a write ony hook which can be used to dispatch actions.
 */
export const useHMSActions = () => {
  const HMSContextConsumer = useContext(HMSContext);
  if (!HMSContextConsumer) {
    throw new Error('HMSContext state variables are not set');
  }
  return HMSContextConsumer.actions;
};
