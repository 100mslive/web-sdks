import { useContext, useEffect } from "react";
import {
  HMSNotificationTypes,
  useHMSNotifications,
} from "@100mslive/react-sdk";
import { ToastBatcher } from "../Toast/ToastBatcher";
import { AppContext } from "../context/AppContext";
import { useIsHeadless } from "../AppData/useUISettings";
import { useIsSidepaneTypeOpen } from "../AppData/useSidepane";
import { SIDE_PANE_OPTIONS } from "../../common/constants";

export const MessageNotifications = () => {
  const notification = useHMSNotifications(HMSNotificationTypes.NEW_MESSAGE);
  const { subscribedNotifications = {} } = useContext(AppContext);
  const isHeadless = useIsHeadless();
  const isChatOpen = useIsSidepaneTypeOpen(SIDE_PANE_OPTIONS.CHAT);
  useEffect(() => {
    if (!notification) {
      return;
    }
    console.debug(`[${notification.type}]`, notification);
    if (
      !subscribedNotifications.NEW_MESSAGE ||
      notification.data?.ignored ||
      isHeadless ||
      isChatOpen
    )
      return;
    ToastBatcher.showToast({ notification });
  }, [
    notification,
    subscribedNotifications.NEW_MESSAGE,
    isHeadless,
    isChatOpen,
  ]);

  return null;
};
