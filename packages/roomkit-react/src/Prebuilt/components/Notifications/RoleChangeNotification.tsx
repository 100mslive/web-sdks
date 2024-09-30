import { useEffect } from 'react';
import { HMSNotificationTypes, useHMSNotifications } from '@100mslive/react-sdk';
import { useUpdateRoomLayout } from '../../provider/roomLayoutProvider';
// @ts-ignore: No implicit Any
import { ToastManager } from '../Toast/ToastManager';
// @ts-ignore: No implicit Any
import { useIsNotificationDisabled } from '../AppData/useUISettings';

export const RoleChangeNotification = () => {
  const notification = useHMSNotifications(HMSNotificationTypes.ROLE_UPDATED);
  const isNotificationDisabled = useIsNotificationDisabled();
  const updateRoomLayoutForRole = useUpdateRoomLayout();

  useEffect(() => {
    if (notification && !isNotificationDisabled) {
      ToastManager.addToast({
        title: `You are now a ${notification.data.roleName}`,
      });
    }
    if (notification && notification.data?.isLocal && notification.data?.roleName) {
      updateRoomLayoutForRole?.(notification.data.roleName);
    }
  }, [notification, isNotificationDisabled]);

  return null;
};
