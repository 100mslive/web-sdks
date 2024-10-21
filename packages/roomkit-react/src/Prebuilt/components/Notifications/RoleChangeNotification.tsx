import { useEffect } from 'react';
import { HMSNotificationTypes, useHMSNotifications } from '@100mslive/react-sdk';
import { useUpdateRoomLayout } from '../../provider/roomLayoutProvider';
// @ts-ignore: No implicit Any
import { ToastManager } from '../Toast/ToastManager';

export const RoleChangeNotification = () => {
  const notification = useHMSNotifications(HMSNotificationTypes.ROLE_UPDATED);
  const updateRoomLayoutForRole = useUpdateRoomLayout();

  useEffect(() => {
    if (!notification?.data) {
      return;
    }
    if (notification.data?.isLocal && notification.data?.roleName) {
      ToastManager.addToast({
        title: `You are now a ${notification.data.roleName}`,
      });
      updateRoomLayoutForRole?.(notification.data.roleName);
    }
  }, [notification]);

  return null;
};
