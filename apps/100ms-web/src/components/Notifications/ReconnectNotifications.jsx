import { useEffect } from "react";
import LogRocket from "logrocket";
import {
  HMSNotificationTypes,
  useHMSNotifications,
} from "@100mslive/react-sdk";
import { ConnectivityIcon, PoorConnectivityIcon } from "@100mslive/react-icons";
import { ToastManager } from "../Toast/ToastManager";
import { TextWithIcon } from "./TextWithIcon";

const notificationTypes = [
  HMSNotificationTypes.RECONNECTED,
  HMSNotificationTypes.RECONNECTING,
];
let notificationId = null;
export const ReconnectNotifications = () => {
  const notification = useHMSNotifications(notificationTypes);
  useEffect(() => {
    if (notification?.type === HMSNotificationTypes.RECONNECTED) {
      LogRocket.track("Reconnected");
      notificationId = ToastManager.replaceToast(notificationId, {
        title: `You are now connected`,
        icon: <ConnectivityIcon />,
        variant: "success",
        duration: 3000,
      });
    } else if (notification?.type === HMSNotificationTypes.RECONNECTING) {
      LogRocket.track("Reconnecting");
      notificationId = ToastManager.replaceToast(notificationId, {
        title: `You are offline for now. while we try to reconnect, please check
        your internet connection.
      `,
        icon: <PoorConnectivityIcon />,
        variant: "warning",
        duration: 10000,
      });
    }
  }, [notification]);
  return null;
};
