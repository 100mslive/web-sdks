import { useEffect } from 'react';
import { HMSNotificationTypes, useHMSNotifications } from '@100mslive/react-sdk';
// @ts-ignore: No implicit Any
import { ToastManager } from '../Toast/ToastManager';

export const DeviceChangeNotifications = () => {
  const notification = useHMSNotifications(HMSNotificationTypes.DEVICE_CHANGE_UPDATE);

  useEffect(() => {
    if (notification) {
      ToastManager.addToast({
        title: notification.message,
      });
    }
  }, [notification]);

  return null;
};
