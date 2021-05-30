import React, { createContext, useContext } from 'react';
import { HMSReactiveStore, IHMSActions } from '../core';
import { HMSContextProviderProps, makeHMSStoreHook } from './storeHook';
import { IHMSStoreReadOnly } from '../core/IHMSStore';

const HMSContext = createContext<HMSContextProviderProps | null>(null);

export interface HMSRoomProviderProps {
  actions?: IHMSActions;
  store?: IHMSStoreReadOnly;
}

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
One HMSRoomProvider will need to be created per room in the UI.
 */
export const useHMSStore = makeHMSStoreHook(HMSContext);

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
