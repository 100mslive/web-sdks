import { useCallback } from 'react';
import { useHMSPrebuiltContext } from '../../AppContext';
// @ts-ignore: No implicit Any
import { PictureInPicture } from '../PIP/PIPManager';
// @ts-ignore: No implicit Any
import { ToastManager } from '../Toast/ToastManager';

export const useRedirectToLeave = () => {
  const { onLeave } = useHMSPrebuiltContext();

  const redirect = useCallback(
    (timeout = 0) => {
      setTimeout(() => {
        PictureInPicture.stop().catch(() => console.error('stopping pip'));
        ToastManager.clearAllToast();
        onLeave?.();
      }, timeout);
    },
    [onLeave],
  );

  return { redirectToLeave: redirect };
};
