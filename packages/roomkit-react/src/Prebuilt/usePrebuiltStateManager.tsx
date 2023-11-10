import { useEffect, useRef, useState } from 'react';
import { interpret, StateMachine } from '@xstate/fsm';
import { selectRoomState, useHMSVanillaStore } from '@100mslive/react-sdk';
// @ts-ignore: No implicit Any
import { PictureInPicture } from './components/PIP/PIPManager';
import { useRoomLayout } from './provider/roomLayoutProvider';
import { useHMSPrebuiltContext } from './AppContext';
import { PrebuiltStateMachine, PrebuiltStateMachineContext, PrebuiltStateMachineEvent } from './PrebuiltStateMachine';
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
  const serviceRef = useRef<StateMachine.Service<PrebuiltStateMachineContext, PrebuiltStateMachineEvent> | undefined>();
  const [state, setState] = useState<string>('');

  const rejoin = () => {
    serviceRef.current?.send('Rejoin');
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
      type: 'InitContext',
      data: { isLeaveEnabled: isLeaveScreenEnabled, isPreviewEnabled: isPreviewScreenEnabled, onLeave, onJoin },
    });
    const storeUnsubscribe = store.subscribe(state => {
      service.send(state);
    }, selectRoomState);
    const { unsubscribe } = service.subscribe(state => {
      if (state.changed) {
        setState(state.value);
        if (state.value !== 'conferencing') {
          PictureInPicture.stop().catch((error: unknown) => console.error('stopping pip', (error as Error).message));
        }
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
