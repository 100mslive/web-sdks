import { useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useHMSPrebuiltContext } from '../../AppContext';
// @ts-ignore: No implicit Any
import { PictureInPicture } from '../PIP/PIPManager';
// @ts-ignore: No implicit Any
import { ToastManager } from '../Toast/ToastManager';
import { useRoomLayoutLeaveScreen } from '../../provider/roomLayoutProvider/hooks/useRoomLayoutScreen';

export const useRedirectToLeave = () => {
  const { isLeaveScreenEnabled } = useRoomLayoutLeaveScreen();
  const { onLeave } = useHMSPrebuiltContext();
  const params = useParams();
  const navigate = useNavigate();

  const redirect = useCallback(() => {
    setTimeout(() => {
      const prefix = isLeaveScreenEnabled ? '/leave/' : '/';
      if (params.role) {
        navigate(prefix + params.roomId + '/' + params.role);
      } else {
        navigate(prefix + params.roomId);
      }
      PictureInPicture.stop().catch(() => console.error('stopping pip'));
      ToastManager.clearAllToast();
      onLeave?.();
    }, 1000);
  }, [isLeaveScreenEnabled, navigate, onLeave, params.role, params.roomId]);

  return { redirectToLeave: redirect };
};
