import { useEffect } from "react";
import {
  HMSNotificationTypes,
  useHMSNotifications,
} from "@100mslive/react-sdk";
import { PersonIcon } from "@100mslive/react-icons";
import { ToastBatcher } from "../Toast/ToastBatcher";
import { TextWithIcon } from "./TextWithIcon";
import {
  UserPreferencesKeys,
  useUserPreferences,
} from "../hooks/useUserPreferences";
import { ConcatenationScope } from "webpack";

const notificationTypes = [
  HMSNotificationTypes.PEER_LIST,
  HMSNotificationTypes.PEER_JOINED,
  HMSNotificationTypes.PEER_LEFT,
];

export const PeerNotifications = () => {
  const notification = useHMSNotifications(notificationTypes);
  const [{ subscribedNotifications }] = useUserPreferences(
    UserPreferencesKeys.UI_SETTINGS
  );
  useEffect(() => {
    if (!notification) {
      return;
    }
    console.debug(`[${notification.type}]`, notification);
    let toast;

    switch (notification.type) {
      case HMSNotificationTypes.PEER_LIST:
        if (subscribedNotifications.PEER_JOINED) {
          toast = notification;
        }
        break;
      case HMSNotificationTypes.PEER_JOINED:
        if (subscribedNotifications.PEER_JOINED) {
          toast = notification;
          console.log("j", notification);
        }
        break;
      case HMSNotificationTypes.PEER_LEFT:
        if (subscribedNotifications.PEER_LEFT) {
          toast = notification;
        }
        break;
      default:
        break;
    }
    if (toast) {
      const duration = 10000;
      ToastBatcher.addToastType({
        notification: toast,
        duration: duration,
        type: toast.type,
      });
    }
  }, [
    notification,
    subscribedNotifications.PEER_JOINED,
    subscribedNotifications.PEER_LEFT,
  ]);

  return null;
};
