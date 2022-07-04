import React from "react";
import { SettingsIcon, NotificationsIcon } from "@100mslive/react-icons";
import { Dialog, Flex, Tabs, Text } from "@100mslive/react-ui";
import DeviceSettings from "./DeviceSettings";
import { NotificationSettings } from "./NotificationSettings";

const SettingsModal = ({ open, onOpenChange, children }) => {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Trigger asChild>{children}</Dialog.Trigger>
      <Dialog.Content
        css={{ w: "min(800px, 100%)", height: "min(656px, 90%)", p: 0 }}
      >
        <Tabs.Root defaultValue="devices" css={{ size: "100%" }}>
          <Tabs.List
            css={{
              w: "18.625rem",
              flexDirection: "column",
              bg: "$bgPrimary",
              p: "$14 $10",
            }}
          >
            <Text variant="h5">Settings </Text>
            <Tabs.Trigger value="devices" css={{ gap: "$8", mt: "$10" }}>
              <SettingsIcon />
              Device Settings
            </Tabs.Trigger>
            <Tabs.Trigger value="notifications" css={{ gap: "$8" }}>
              <NotificationsIcon />
              Notifications
            </Tabs.Trigger>
          </Tabs.List>
          <Flex
            direction="column"
            css={{ flex: "1 1 0", minWidth: 0, mr: "$4" }}
          >
            <Tabs.Content value="devices">
              <DeviceSettings />
            </Tabs.Content>
            <Tabs.Content value="notifications">
              <NotificationSettings />
            </Tabs.Content>
          </Flex>
        </Tabs.Root>
      </Dialog.Content>
    </Dialog.Root>
  );
};

export default SettingsModal;
