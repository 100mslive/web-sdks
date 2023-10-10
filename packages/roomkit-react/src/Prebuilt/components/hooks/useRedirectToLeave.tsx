import { useCallback } from 'react';
import { useHMSPrebuiltContext } from '../../AppContext';
import { PrebuiltStates, useHMSAppStateContext } from '../../AppStateContext';
// @ts-ignore: No implicit Any
import { PictureInPicture } from '../PIP/PIPManager';
// @ts-ignore: No implicit Any
import { ToastManager } from '../Toast/ToastManager';
import {
  useRoomLayoutLeaveScreen,
  useRoomLayoutPreviewScreen,
} from '../../provider/roomLayoutProvider/hooks/useRoomLayoutScreen';

export const useRedirectToLeave = () => {
  const { isLeaveScreenEnabled } = useRoomLayoutLeaveScreen();
  const { isPreviewScreenEnabled } = useRoomLayoutPreviewScreen();
  const { onLeave } = useHMSPrebuiltContext();
  const { setActiveState } = useHMSAppStateContext();

  const redirect = useCallback(
    (timeout = 0) => {
      setTimeout(() => {
        PictureInPicture.stop().catch(() => console.error('stopping pip'));
        setActiveState(
          isLeaveScreenEnabled
            ? PrebuiltStates.LEAVE
            : isPreviewScreenEnabled
            ? PrebuiltStates.PREVIEW
            : PrebuiltStates.MEETING,
        );
        ToastManager.clearAllToast();
        onLeave?.();
      }, timeout);
    },
    [isLeaveScreenEnabled, isPreviewScreenEnabled, onLeave, setActiveState],
  );

  return { redirectToLeave: redirect };
};
