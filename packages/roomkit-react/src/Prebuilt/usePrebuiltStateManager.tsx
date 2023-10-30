import { useEffect, useRef, useState } from 'react';
import { interpret, StateMachine } from '@xstate/fsm';
import { HMSRoomState, selectRoomState, useHMSVanillaStore } from '@100mslive/react-sdk';
// @ts-ignore: No implicit Any
import { PictureInPicture } from './components/PIP/PIPManager';
import { useRoomLayout } from './provider/roomLayoutProvider';
import { useHMSPrebuiltContext } from './AppContext';
import { MachineContext, MachineEvent, PrebuiltStateMachine } from './PrebuiltStateMachine';
import {
  useRoomLayoutLeaveScreen,
  useRoomLayoutPreviewScreen,
} from './provider/roomLayoutProvider/hooks/useRoomLayoutScreen';

export const usePrebuiltStateManager = () => {
  const roomLayout = useRoomLayout();
  const store = useHMSVanillaStore();
  const { onLeave, onJoin } = useHMSPrebuiltContext();
  const { isLeaveScreenEnabled } = useRoomLayoutLeaveScreen();
  const { isPreviewScreenEnabled } = useRoomLayoutPreviewScreen();
  const machineRef = useRef(PrebuiltStateMachine());
  const serviceRef = useRef<StateMachine.Service<MachineContext, MachineEvent> | undefined>();
  const [state, setState] = useState<string>('');

  const rejoin = () => {
    if (serviceRef.current) {
      serviceRef.current.send('NEXT');
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
    service.send({
      type: 'SET_DATA',
      data: { isLeaveEnabled: isLeaveScreenEnabled, isPreviewEnabled: isPreviewScreenEnabled },
    });
    let prevState = store.getState(selectRoomState);
    const storeUnsubscribe = store.subscribe(state => {
      if (state === HMSRoomState.Disconnected && prevState === state) {
        service.send('NEXT');
      } else if (state === HMSRoomState.Connected && prevState !== HMSRoomState.Reconnecting) {
        service.send('NEXT');
      } else if (prevState === HMSRoomState.Disconnecting && state === HMSRoomState.Disconnected) {
        service.send('NEXT');
      }
      prevState = state;
    }, selectRoomState);
    const { unsubscribe } = service.subscribe(state => {
      setState(state.value);
      if (state.value === 'conferencing') {
        onJoin?.();
      } else if (state.value === 'leave') {
        PictureInPicture.stop().catch((error: unknown) => console.error('stopping pip', (error as Error).message));
        onLeave?.();
      }
    });
    return () => {
      storeUnsubscribe();
      unsubscribe();
      service.stop();
    };
  }, [roomLayout, isLeaveScreenEnabled, isPreviewScreenEnabled, store]); //eslint-disable-line

  return { rejoin, state };
};
