import React, { useEffect, useState } from "react";
import {
  HMSNotificationTypes,
  useHMSNotifications,
} from "@100mslive/react-sdk";
import { Dialog, Text } from "@100mslive/react-ui";

export function PermissionErrorModal() {
  const notification = useHMSNotifications(HMSNotificationTypes.ERROR);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!notification || notification.data?.code !== 3001) {
      return;
    }
    console.debug(`[${notification.type}]`, notification);
    const errorMessage = notification.data?.message;
    const hasAudio = errorMessage.includes("audio");
    const hasVideo = errorMessage.includes("video");
    let deviceType;
    if (hasAudio && hasVideo) {
      deviceType = "Camera and Microphone";
    } else if (hasAudio) {
      deviceType = "Microphone";
    } else if (hasVideo) {
      deviceType = "Camera";
    }
    setError(deviceType);
  }, [notification]);
  return error ? (
    <Dialog.Root
      open={error}
      onOpenChange={value => {
        if (!value) {
          setError("");
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
            {error} permissions are blocked
          </Text>
          <Dialog.DefaultClose data-testid="dialoge_cross_icon" />
        </Dialog.Title>
        <Text variant="md" css={{ py: "$10" }}>
          Access to {error} is required. If you didn't get a permission dialog,
          please try refreshing or open in incognito.
        </Text>
      </Dialog.Content>
    </Dialog.Root>
  ) : null;
}
