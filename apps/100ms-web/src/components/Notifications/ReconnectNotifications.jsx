import { useEffect, useState } from "react";
import { logMessage } from "zipyai";
import {
  HMSNotificationTypes,
  useHMSNotifications,
} from "@100mslive/react-sdk";
import { Box, Dialog, Flex, Loading, Text } from "@100mslive/react-ui";
import { ToastConfig } from "../Toast/ToastConfig";
import { ToastManager } from "../Toast/ToastManager";

const notificationTypes = [
  HMSNotificationTypes.RECONNECTED,
  HMSNotificationTypes.RECONNECTING,
];
let notificationId = null;
export const ReconnectNotifications = () => {
  const notification = useHMSNotifications(notificationTypes);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (notification?.type === HMSNotificationTypes.RECONNECTED) {
      logMessage("Reconnected");
      notificationId = ToastManager.replaceToast(
        notificationId,
        ToastConfig.RECONNECTED.single()
      );
      setOpen(false);
    } else if (notification?.type === HMSNotificationTypes.RECONNECTING) {
      logMessage("Reconnecting");
      ToastManager.removeToast(notificationId);
      setOpen(true);
    }
  }, [notification]);
  useEffect(() => {
    const conferenceEle = document.getElementById("conferencing");
    if (conferenceEle) {
      conferenceEle.style.pointerEvents = open ? "none" : "unset";
    }
  }, [open]);
  if (!open) return null;
  return (
    <Dialog.Root open={open} modal={false}>
      <Dialog.Portal container={document.getElementById("conferencing")}>
        <Box
          css={{
            position: "absolute",
            pointerEvents: "none",
            backgroundColor: "rgba(0, 0, 0, 0.5);",
            inset: 0,
          }}
        />
        <Dialog.Content
          css={{
            width: "fit-content",
            maxWidth: "80%",
            p: "$4 $8",
            position: "relative",
            top: "unset",
            bottom: "$9",
            transform: "translate(-50%, -100%)",
            animation: "none !important",
          }}
        >
          <Flex align="center">
            <div style={{ display: "inline", margin: "0.25rem" }}>
              <Loading size={16} />
            </div>
            <Text css={{ fontSize: "$space$8", color: "$textHighEmp" }}>
              You lost your network connection. Trying to reconnect.
            </Text>
          </Flex>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
