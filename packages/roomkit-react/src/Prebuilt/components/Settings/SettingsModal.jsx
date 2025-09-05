import React, { useCallback, useEffect, useState } from 'react';
import { useMedia } from 'react-use';
import { ChevronLeftIcon, CrossIcon, GridFourIcon, NotificationsIcon, SettingsIcon } from '@100mslive/react-icons';
import { HorizontalDivider } from '../../../Divider';
import { IconButton } from '../../../IconButton';
import { Box, Flex } from '../../../Layout';
import { Dialog } from '../../../Modal';
import { Sheet } from '../../../Sheet';
import { Tabs } from '../../../Tabs';
import { Text } from '../../../Text';
import { config as cssConfig } from '../../../Theme';
import DeviceSettings from './DeviceSettings';
import { LayoutSettings } from './LayoutSettings';
import { NotificationSettings } from './NotificationSettings';
import { settingContent } from './common';

const settingsList = [
  {
    tabName: 'devices',
    title: 'Device Settings',
    icon: SettingsIcon,
    content: DeviceSettings,
  },
  {
    tabName: 'notifications',
    title: 'Notifications',
    icon: NotificationsIcon,
    content: NotificationSettings,
  },
  {
    tabName: 'layout',
    title: 'Layout',
    icon: GridFourIcon,
    content: LayoutSettings,
  },
];

const SettingsModal = ({ open, onOpenChange, screenType, children = <></> }) => {
  const mediaQueryLg = cssConfig.media.md;
  const isMobile = useMedia(mediaQueryLg);

  const [showSetting, setShowSetting] = useState(() =>
    settingsList.reduce((obj, { tabName }) => ({ ...obj, [tabName]: true }), {}),
  );

  const hideSettingByTabName = useCallback(
    key => hide => setShowSetting(prev => ({ ...prev, [key]: !hide })),
    [setShowSetting],
  );

  useEffect(() => {
    if (screenType === 'hls_live_streaming') {
      hideSettingByTabName('layout')(true);
    }
  }, [screenType, hideSettingByTabName]);

  const [selection, setSelection] = useState(() => Object.keys(showSetting).find(key => showSetting[key]) ?? '');
  const resetSelection = useCallback(() => {
    setSelection('');
  }, []);

  useEffect(() => {
    if (isMobile) {
      setSelection('');
    } else {
      const firstNotHiddenTabName = Object.keys(showSetting).find(key => showSetting[key]) ?? '';
      setSelection(firstNotHiddenTabName);
    }
  }, [isMobile, showSetting]);

  return isMobile ? (
    <MobileSettingModal
      open={open}
      onOpenChange={onOpenChange}
      selection={selection}
      setSelection={setSelection}
      showSetting={showSetting}
      hideSettingByTabName={hideSettingByTabName}
      resetSelection={resetSelection}
    >
      {children}
    </MobileSettingModal>
  ) : (
    <DesktopSettingModal
      open={open}
      onOpenChange={onOpenChange}
      selection={selection}
      setSelection={setSelection}
      showSetting={showSetting}
      hideSettingByTabName={hideSettingByTabName}
      resetSelection={resetSelection}
    >
      {children}
    </DesktopSettingModal>
  );
};

const MobileSettingModal = ({
  open,
  onOpenChange,
  selection,
  setSelection,
  showSetting,
  hideSettingByTabName,
  resetSelection,
  children = <></>,
}) => {
  return (
    <Sheet.Root open={open} onOpenChange={onOpenChange}>
      <Sheet.Trigger asChild>{children}</Sheet.Trigger>
      <Sheet.Content
        css={{
          bg: 'surface.dim',
          overflowY: 'auto',
        }}
      >
        <Sheet.Title css={{ py: '10', px: '8', alignItems: 'center' }}>
          <Flex direction="row" justify="between" css={{ w: '100%' }}>
            {!selection ? (
              <Text variant="h6" css={{ display: 'flex' }}>
                Settings
              </Text>
            ) : (
              <Text variant="h6" css={{ display: 'flex' }}>
                <Box as="span" css={{ r: 'round', mr: '2' }} onClick={resetSelection}>
                  <ChevronLeftIcon />
                </Box>
                {selection?.charAt(0).toUpperCase() + selection.slice(1)}
              </Text>
            )}
            <Sheet.Close>
              <IconButton as="div" data-testid="dialog_cross_icon">
                <CrossIcon />
              </IconButton>
            </Sheet.Close>
          </Flex>
        </Sheet.Title>
        <HorizontalDivider />
        {!selection ? (
          <Flex
            direction="column"
            css={{
              pb: '8',
              overflowY: 'auto',
            }}
          >
            {settingsList
              .filter(({ tabName }) => showSetting[tabName])
              .map(({ icon: Icon, tabName, title }) => {
                return (
                  <Box
                    key={tabName}
                    value={tabName}
                    onClick={() => {
                      setSelection(tabName);
                    }}
                    as="div"
                    css={{
                      all: 'unset',
                      fontFamily: '$sans',
                      p: '$10 $8',
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: 'sm',
                      lineHeight: '$sm',
                      color: 'onSurface.high',
                      userSelect: 'none',
                      gap: '8',
                      cursor: 'pointer',
                      '&:hover': {
                        bg: 'surface.brighter',
                        r: '1',
                        gap: '8',
                        border: 'none',
                      },
                      borderBottom: '1px solid $border_default',
                    }}
                  >
                    <Icon />
                    {title}
                  </Box>
                );
              })}
          </Flex>
        ) : (
          <Box
            direction="column"
            css={{ overflowY: 'scroll', px: '8', py: '10', maxHeight: '70vh', overflowX: 'hidden' }}
          >
            {settingsList
              .filter(({ tabName }) => showSetting[tabName] && selection === tabName)
              .map(({ content: Content, title, tabName }) => {
                return <Content key={title} setHide={hideSettingByTabName(tabName)} />;
              })}
          </Box>
        )}
      </Sheet.Content>
    </Sheet.Root>
  );
};
const DesktopSettingModal = ({
  open,
  onOpenChange,
  selection,
  setSelection,
  showSetting,
  hideSettingByTabName,
  resetSelection,
  children = <></>,
}) => {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Trigger asChild>{children}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Content
          css={{
            w: 'min(800px, 90%)',
            height: 'min(656px, 90%)',
            p: 0,
            r: '4',
          }}
        >
          <Tabs.Root
            value={selection}
            activationMode="automatic"
            onValueChange={setSelection}
            css={{ size: '100%', position: 'relative' }}
          >
            <Tabs.List
              css={{
                w: '18.625rem',
                flexDirection: 'column',
                bg: 'background.default',
                p: '$14 $10',
                borderTopLeftRadius: '$4',
                borderBottomLeftRadius: '$4',
              }}
            >
              <Text variant="h5">Settings </Text>
              <Flex direction="column" css={{ mx: 0, overflowY: 'auto', pt: '10' }}>
                {settingsList
                  .filter(({ tabName }) => showSetting[tabName])
                  .map(({ icon: Icon, tabName, title }) => {
                    return (
                      <Tabs.Trigger key={tabName} value={tabName} css={{ gap: '8' }}>
                        <Icon />
                        {title}
                      </Tabs.Trigger>
                    );
                  })}
              </Flex>
            </Tabs.List>
            {selection && (
              <Flex
                direction="column"
                css={{
                  flex: '1 1 0',
                  minWidth: 0,
                  mr: '4',
                }}
              >
                {settingsList
                  .filter(({ tabName }) => showSetting[tabName])
                  .map(({ content: Content, title, tabName }) => {
                    return (
                      <Tabs.Content key={tabName} value={tabName} className={settingContent()}>
                        <SettingsContentHeader onBack={resetSelection} isMobile={false}>
                          {title}
                        </SettingsContentHeader>
                        <Content setHide={hideSettingByTabName(tabName)} />
                      </Tabs.Content>
                    );
                  })}
              </Flex>
            )}
          </Tabs.Root>
          <Dialog.Close css={{ position: 'absolute', right: '10', top: '10' }}>
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
    <Text variant="h6" css={{ mb: '12', display: 'flex', alignItems: 'center' }}>
      {isMobile && (
        <Box as="span" css={{ bg: 'surface.bright', mr: '4', r: 'round', p: '2' }} onClick={onBack}>
          <ChevronLeftIcon />
        </Box>
      )}
      {children}
    </Text>
  );
};

export default SettingsModal;
