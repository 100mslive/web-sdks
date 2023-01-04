import React, { useCallback, useEffect, useState } from "react";
import { useMedia } from "react-use";
import { selectLocalPeerRoleName, useHMSStore } from "@100mslive/react-sdk";
import {
  ChevronLeftIcon,
  CrossIcon,
  GridFourIcon,
  NotificationsIcon,
  SettingsIcon,
} from "@100mslive/react-icons";
import {
  Box,
  config as cssConfig,
  Dialog,
  Flex,
  IconButton,
  Tabs,
  Text,
} from "@100mslive/react-ui";
import DeviceSettings from "./DeviceSettings";
import { LayoutSettings } from "./LayoutSettings";
import { NotificationSettings } from "./NotificationSettings";
import { useHLSViewerRole } from "../AppData/useUISettings";
import { settingContent } from "./common.js";

const settingMap = {
  devices: {
    title: "Device Settings",
    icon: SettingsIcon,
    content: DeviceSettings,
  },
  notifications: {
    title: "Notifications",
    icon: NotificationsIcon,
    content: NotificationSettings,
  },
  layout: {
    title: "Layout",
    icon: GridFourIcon,
    content: LayoutSettings,
  },
};

const SettingsModal = ({ open, onOpenChange, children }) => {
  const mediaQueryLg = cssConfig.media.md;
  const isMobile = useMedia(mediaQueryLg);

  const hlsViewerRole = useHLSViewerRole();
  const localPeerRole = useHMSStore(selectLocalPeerRoleName);
  const isHlsViewer = hlsViewerRole === localPeerRole;

  const [showSetting, setShowSetting] = useState(() =>
    Object.keys(settingMap).reduce((obj, key) => ({ ...obj, [key]: true }), {})
  );

  const [selection, setSelection] = useState(
    () =>
      Object.keys(showSetting)
        .filter(key => showSetting[key])
        .at(0) ?? ""
  );
  const resetSelection = useCallback(() => {
    setSelection("");
  }, []);

  const setHideKey = useCallback(
    key => hide => setShowSetting(prev => ({ ...prev, [key]: !hide })),
    [setShowSetting]
  );

  useEffect(() => {
    setSelection(isMobile ? "" : "devices");
  }, [isMobile]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Trigger asChild>{children}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Content
          css={{
            w: "min(800px, 90%)",
            height: "min(656px, 90%)",
            p: 0,
            r: "$4",
          }}
        >
          <Tabs.Root
            value={selection}
            activationMode={isMobile ? "manual" : "automatic"}
            onValueChange={setSelection}
            css={{ size: "100%", position: "relative" }}
          >
            <Tabs.List
              css={{
                w: isMobile ? "100%" : "18.625rem",
                flexDirection: "column",
                bg: "$backgroundDefault",
                p: "$14 $10",
                borderTopLeftRadius: "$4",
                borderBottomLeftRadius: "$4",
              }}
            >
              <Text variant="h5">Settings </Text>
              <Flex
                direction="column"
                css={{ mx: isMobile ? "-$8" : 0, overflowY: "auto", pt: "$10" }}
              >
                {Object.keys(showSetting)
                  .filter(key => showSetting[key])
                  .map(key => {
                    const Icon = settingMap[key].icon;
                    return (
                      <Tabs.Trigger key={key} value={key} css={{ gap: "$8" }}>
                        <Icon />
                        {settingMap[key].title}
                      </Tabs.Trigger>
                    );
                  })}
              </Flex>
            </Tabs.List>
            {selection && (
              <Flex
                direction="column"
                css={{
                  flex: "1 1 0",
                  minWidth: 0,
                  mr: "$4",
                  ...(isMobile
                    ? {
                        position: "absolute",
                        left: 0,
                        right: 0,
                        bg: "$surfaceDefault",
                        width: "100%",
                        height: "100%",
                      }
                    : {}),
                }}
              >
                {Object.keys(showSetting)
                  .filter(key => showSetting[key])
                  .map(key => {
                    const Content = settingMap[key].content;
                    return (
                      <Tabs.Content value={key} className={settingContent()}>
                        <SettingsContentHeader
                          onBack={resetSelection}
                          isMobile={isMobile}
                        >
                          {settingMap[key].title}
                        </SettingsContentHeader>
                        <Content setHide={setHideKey(key)} />
                      </Tabs.Content>
                    );
                  })}
              </Flex>
            )}
          </Tabs.Root>
          <Dialog.Close
            css={{ position: "absolute", right: "$10", top: "$10" }}
          >
            <IconButton as="div" data-testid="dialog_cross_icon">
              <CrossIcon />
            </IconButton>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

const SettingsContentHeader = ({ children, isMobile, onBack }) => {
  return (
    <Text
      variant="h6"
      css={{ mb: "$12", display: "flex", alignItems: "center" }}
    >
      {isMobile && (
        <Box
          as="span"
          css={{ bg: "$surfaceLight", mr: "$4", r: "$round", p: "$2" }}
          onClick={onBack}
        >
          <ChevronLeftIcon />
        </Box>
      )}
      {children}
    </Text>
  );
};

export default SettingsModal;
