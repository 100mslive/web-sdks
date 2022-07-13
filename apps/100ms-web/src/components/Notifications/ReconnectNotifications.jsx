import { useEffect } from "react";
import LogRocket from "logrocket";
import { ToastBatcher } from "../Toast/ToastBatcher";
import {
  HMSNotificationTypes,
  useHMSNotifications,
} from "@100mslive/react-sdk";

const notificationTypes = [
  HMSNotificationTypes.RECONNECTED,
  HMSNotificationTypes.RECONNECTING,
];
export const ReconnectNotifications = () => {
  const notification = useHMSNotifications(notificationTypes);
  useEffect(() => {
    if (notification?.type === HMSNotificationTypes.RECONNECTED) {
      LogRocket.track("Reconnected");
      ToastBatcher.showToast({ notification });
    } else if (notification?.type === HMSNotificationTypes.RECONNECTING) {
      LogRocket.track("Reconnecting");
      ToastBatcher.showToast({ notification });
    }
  }, [notification]);
  return null;
};
