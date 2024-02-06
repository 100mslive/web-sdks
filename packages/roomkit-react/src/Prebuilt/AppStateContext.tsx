import React, { useContext, useEffect } from 'react';
import { usePreviousDistinct } from 'react-use';
import { HMSRoomState, selectRoomState, useHMSStore } from '@100mslive/react-sdk';
import { VBHandler } from './components/VirtualBackground/VBHandler';
import { useRoomLayout } from './provider/roomLayoutProvider';
import { useRedirectToLeave } from './components/hooks/useRedirectToLeave';
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

export const useAppStateManager = () => {
  const roomLayout = useRoomLayout();
  const [activeState, setActiveState] = React.useState<PrebuiltStates | undefined>();
  const roomState = useHMSStore(selectRoomState);
  const prevRoomState = usePreviousDistinct(roomState);
  const { isLeaveScreenEnabled } = useRoomLayoutLeaveScreen();
  const { isPreviewScreenEnabled } = useRoomLayoutPreviewScreen();
  const { redirectToLeave } = useRedirectToLeave();

  const rejoin = () => {
    setActiveState(isPreviewScreenEnabled ? PrebuiltStates.PREVIEW : PrebuiltStates.MEETING);
  };

  useEffect(() => {
    if (!roomLayout) {
      return;
    }
    if (roomState === HMSRoomState.Connected) {
      setActiveState(PrebuiltStates.MEETING);
    } else if (
      prevRoomState &&
      [HMSRoomState.Reconnecting, HMSRoomState.Connected, HMSRoomState.Connecting].includes(prevRoomState) &&
      [HMSRoomState.Disconnecting, HMSRoomState.Disconnected].includes(roomState)
    ) {
      const goTo = isPreviewScreenEnabled ? PrebuiltStates.PREVIEW : PrebuiltStates.MEETING;
      setActiveState(isLeaveScreenEnabled ? PrebuiltStates.LEAVE : goTo);
      VBHandler.reset();
      redirectToLeave(1000); // to clear toasts after 1 second
    } else if (!prevRoomState && roomState === HMSRoomState.Disconnected) {
      setActiveState(isPreviewScreenEnabled ? PrebuiltStates.PREVIEW : PrebuiltStates.MEETING);
    }
  }, [roomLayout, roomState, isLeaveScreenEnabled, isPreviewScreenEnabled, prevRoomState, redirectToLeave]);

  return { activeState, rejoin };
};
