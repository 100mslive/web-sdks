import { useEffect, useRef } from 'react';
import { HMSNotificationTypes, useHMSNotifications } from '@100mslive/react-sdk';
// @ts-ignore: No implicit Any
import { ToastConfig } from '../Toast/ToastConfig';
// @ts-ignore: No implicit Any
import { ToastManager } from '../Toast/ToastManager';

const notificationTypes = [HMSNotificationTypes.RECONNECTED, HMSNotificationTypes.RECONNECTING];
let notificationId: string | null = null;

export const ReconnectNotifications = () => {
  const notification = useHMSNotifications(notificationTypes);
  const prevErrorCode = useRef(0);
  useEffect(() => {
    if (!notification) {
      return;
    }
    if (notification.type === HMSNotificationTypes.RECONNECTED) {
      notificationId = ToastManager.replaceToast(
        notificationId,
        ToastConfig.RECONNECTED.single([4005, 4006].includes(prevErrorCode.current)),
      );
    } else if (notification.type === HMSNotificationTypes.RECONNECTING) {
      prevErrorCode.current = notification.data?.code || 0;
      notificationId = ToastManager.replaceToast(
        notificationId,
        ToastConfig.RECONNECTING.single(notification.data?.message),
      );
    }
  }, [notification]);

  return null;
};
