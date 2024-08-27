import React, { useContext, useEffect } from 'react';
import { usePreviousDistinct } from 'react-use';
import { match, P } from 'ts-pattern';
import { HMSRoomState, selectRoomState, useHMSActions, useHMSStore } from '@100mslive/react-sdk';
import { VBHandler } from './components/VirtualBackground/VBHandler';
import { useRoomLayout, useSetOriginalLayout } from './provider/roomLayoutProvider';
import { useRedirectToLeave } from './components/hooks/useRedirectToLeave';
import {
  useRoomLayoutLeaveScreen,
  useRoomLayoutPreviewScreen,
} from './provider/roomLayoutProvider/hooks/useRoomLayoutScreen';
import { APP_DATA } from './common/constants';

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
  const setOriginalLayout = useSetOriginalLayout();
  const [activeState, setActiveState] = React.useState<PrebuiltStates | undefined>();
  const roomState = useHMSStore(selectRoomState);
  const prevRoomState = usePreviousDistinct(roomState);
  const hmsActions = useHMSActions();
  const { isLeaveScreenEnabled } = useRoomLayoutLeaveScreen();
  const { isPreviewScreenEnabled } = useRoomLayoutPreviewScreen();
  const { redirectToLeave } = useRedirectToLeave();

  const rejoin = () => {
    setOriginalLayout?.();
    hmsActions.setAppData(APP_DATA.authToken, '');
    setActiveState(isPreviewScreenEnabled ? PrebuiltStates.PREVIEW : PrebuiltStates.MEETING);
  };

  useEffect(() => {
    if (!roomLayout) {
      return;
    }
    match([roomState, prevRoomState])
      .with([HMSRoomState.Connected, P.any], () => setActiveState(PrebuiltStates.MEETING))
      .with(
        [HMSRoomState.Disconnecting, HMSRoomState.Connected],
        [HMSRoomState.Disconnecting, HMSRoomState.Connecting],
        [HMSRoomState.Disconnecting, HMSRoomState.Reconnecting],
        [HMSRoomState.Disconnected, HMSRoomState.Connected],
        [HMSRoomState.Disconnected, HMSRoomState.Connecting],
        [HMSRoomState.Disconnected, HMSRoomState.Reconnecting],
        () => {
          setActiveState(
            match({ isLeaveScreenEnabled, isPreviewScreenEnabled })
              .with({ isLeaveScreenEnabled: true }, () => PrebuiltStates.LEAVE)
              .with({ isPreviewScreenEnabled: true }, () => PrebuiltStates.PREVIEW)
              .otherwise(() => PrebuiltStates.MEETING),
          );
          VBHandler.reset();
          redirectToLeave(1000); // to clear toasts after 1 second
        },
      )
      .with([HMSRoomState.Disconnected, P.nullish], () => {
        setActiveState(isPreviewScreenEnabled ? PrebuiltStates.PREVIEW : PrebuiltStates.MEETING);
      })
      .otherwise(() => {
        // do nothing
      });
    setActiveState(PrebuiltStates.LEAVE);
  }, [roomLayout, roomState, isLeaveScreenEnabled, isPreviewScreenEnabled, prevRoomState, redirectToLeave]);
  return { activeState, rejoin };
};
