import React, { useEffect, useState } from "react";
import {
  HMSNotificationTypes,
  useHMSNotifications,
} from "@100mslive/react-sdk";
import { Dialog, Text } from "@100mslive/react-ui";

export function PermissionErrorModal() {
  const notification = useHMSNotifications(HMSNotificationTypes.ERROR);
  const [deviceType, setDeviceType] = useState("");
  const [isSystemError, setIsSystemError] = useState(false);
  useEffect(() => {
    if (
      !notification ||
      (notification.data?.code !== 3001 && notification.data?.code !== 3011) ||
      (notification.data?.code === 3001 &&
        notification.data?.message.includes("screen"))
    ) {
      return;
    }
    console.error(`[${notification.type}]`, notification);
    const errorMessage = notification.data?.message;
    const hasAudio = errorMessage.includes("audio");
    const hasVideo = errorMessage.includes("video");
    const hasScreen = errorMessage.includes("screen");
    let deviceType;
    if (hasAudio && hasVideo) {
      deviceType = "Camera and Microphone";
    } else if (hasAudio) {
      deviceType = "Microphone";
    } else if (hasVideo) {
      deviceType = "Camera";
    } else if (hasScreen) {
      deviceType = "Screenshare";
    }
    setDeviceType(deviceType);
    setIsSystemError(notification.data.code === 3011);
  }, [notification]);
  return deviceType ? (
    <Dialog.Root
      open
      onOpenChange={value => {
        if (!value) {
          setDeviceType("");
        }
      }}
    >
      <Dialog.Content css={{ w: "min(480px, 90%)" }}>
        <Dialog.Title
          css={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid $borderDefault",
            pb: "$8",
          }}
        >
          <Text css={{ fontWeight: "$semiBold" }}>
            {deviceType} permissions are blocked
          </Text>
          <Dialog.DefaultClose
            data-testid="dialoge_cross_icon"
            css={{ alignSelf: "start" }}
          />
        </Dialog.Title>
        <Text variant="md" css={{ py: "$10" }}>
          Access to {deviceType} is required.&nbsp;
          {isSystemError
            ? `Enable permissions for ${deviceType} from sytem settings`
            : "If you didn't get a permission dialog, please try refreshing or open in incognito window."}
        </Text>
      </Dialog.Content>
    </Dialog.Root>
  ) : null;
}
