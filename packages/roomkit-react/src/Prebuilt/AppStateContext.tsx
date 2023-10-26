import React, { useContext, useEffect, useRef } from 'react';
import { interpret, StateMachine } from '@xstate/fsm';
import { HMSRoomState, selectRoomState, useHMSVanillaStore } from '@100mslive/react-sdk';
import { useRoomLayout } from './provider/roomLayoutProvider';
import { AppStateMachine, MachineContext, MachineEvent } from './AppStateMachine';
import {
  useRoomLayoutLeaveScreen,
  useRoomLayoutPreviewScreen,
} from './provider/roomLayoutProvider/hooks/useRoomLayoutScreen';

export enum PrebuiltStates {
  MEETING = 'meeting',
  PREVIEW = 'preview',
  LEAVE = 'leave',
}

type AppStateContextType = {
  rejoin: () => void;
};

export const AppStateContext = React.createContext<AppStateContextType>({
  rejoin: () => {
    console.log('Rejoin');
  },
});

AppStateContext.displayName = 'AppStateContext';

export const useHMSAppStateContext = () => {
  const context = useContext(AppStateContext);
  if (!context) {
    throw Error('Make sure AppStateContext.Provider is present at the top level of your application');
  }
  return context;
};

export const useAppStateManager = (onChange: (state: 'preview' | 'conferencing' | 'leave') => void) => {
  const roomLayout = useRoomLayout();
  const store = useHMSVanillaStore();
  const { isLeaveScreenEnabled } = useRoomLayoutLeaveScreen();
  const { isPreviewScreenEnabled } = useRoomLayoutPreviewScreen();
  const machineRef = useRef(AppStateMachine());
  const serviceRef = useRef<StateMachine.Service<MachineContext, MachineEvent> | undefined>();

  const rejoin = () => {
    if (serviceRef.current) {
      serviceRef.current.send('REJOIN');
    }
  };

  useEffect(() => {
    if (!roomLayout) {
      return;
    }
    const machine = machineRef.current;
    const service = interpret(machine);
    serviceRef.current = service;
    service.start();
    service.send({ type: 'SET_DATA', data: { isLeaveEnabled: false, isPreviewEnabled: isPreviewScreenEnabled } });
    let prevState = store.getState(selectRoomState);
    const storeUnsubscribe = store.subscribe(state => {
      if (state === HMSRoomState.Disconnected && prevState === state) {
        service.send('PREVIEW');
      } else if (state === HMSRoomState.Connected) {
        service.send('JOIN');
      } else if (prevState === HMSRoomState.Disconnecting && state === HMSRoomState.Disconnected) {
        service.send('LEAVE');
      }
      prevState = state;
    }, selectRoomState);
    const { unsubscribe } = service.subscribe(state => {
      console.log(state);
      // @ts-ignore
      onChange(service.state.value);
    });
    return () => {
      storeUnsubscribe();
      unsubscribe();
      service.stop();
    };
  }, [roomLayout, isLeaveScreenEnabled, isPreviewScreenEnabled, store, onChange]);

  return { rejoin };
};
