import React, { useCallback, useEffect, useState } from 'react';
import { useMedia } from 'react-use';
import { selectLocalPeerRoleName, useHMSStore } from '@100mslive/react-sdk';
import { ChevronLeftIcon, CrossIcon } from '@100mslive/react-icons';
import { HorizontalDivider } from '../../../Divider';
import { IconButton } from '../../../IconButton';
import { Box, Flex } from '../../../Layout';
import { Dialog } from '../../../Modal';
import { Sheet } from '../../../Sheet';
import { Tabs } from '../../../Tabs';
import { Text } from '../../../Text';
import { config as cssConfig } from '../../../Theme';
import { useHLSViewerRole } from '../AppData/useUISettings';
import { settingContent, settingsList } from './common.js';

const SettingsModal = ({ open, onOpenChange, children = <></> }) => {
  const mediaQueryLg = cssConfig.media.md;
  const isMobile = useMedia(mediaQueryLg);

  const hlsViewerRole = useHLSViewerRole();
  const localPeerRole = useHMSStore(selectLocalPeerRoleName);
  const isHlsViewer = hlsViewerRole === localPeerRole;

  const [showSetting, setShowSetting] = useState(() =>
    settingsList.reduce((obj, { tabName }) => ({ ...obj, [tabName]: true }), {}),
  );

  const hideSettingByTabName = useCallback(
    key => hide => setShowSetting(prev => ({ ...prev, [key]: !hide })),
    [setShowSetting],
  );

  useEffect(() => {
    if (isHlsViewer) {
      hideSettingByTabName('layout')(true);
    }
  }, [isHlsViewer, hideSettingByTabName]);

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
  console.log('show setting ', selection, settingsList);

  return isMobile ? (
    <Sheet.Root open={open} onOpenChange={onOpenChange}>
      <Sheet.Trigger asChild>{children}</Sheet.Trigger>
      <Sheet.Content>
        <Sheet.Title>
          {!selection ? (
            <Flex direction="row" justify="between" css={{ width: '100%' }}>
              <Flex justify="start" align="center" gap="3">
                <Text variant="h5">Settings</Text>
              </Flex>
            </Flex>
          ) : (
            <Text variant="h6" css={{ mb: '$12', display: 'flex', alignItems: 'center' }}>
              <Box as="span" css={{ mr: '$4', r: '$round', p: '$2' }} onClick={resetSelection}>
                <ChevronLeftIcon />
              </Box>
              {selection}
            </Text>
          )}
        </Sheet.Title>
        <HorizontalDivider css={{ my: '$8' }} />

        <Tabs.Root
          value={selection}
          activationMode={isMobile ? 'manual' : 'automatic'}
          onValueChange={setSelection}
          css={{ size: '100%', position: 'relative', borderTopLeftRadius: '$4', borderTopRightRadius: '$4' }}
        >
          <Tabs.List
            css={{
              flexDirection: 'column',
            }}
          >
            {/* <Flex justify="start" align="center" gap="3">
              <InfoIcon />
              <Text variant="h5">Sheet Heading</Text>
            </Flex> */}
            {settingsList
              .filter(({ tabName }) => showSetting[tabName])
              .map(({ icon: Icon, tabName, title }) => {
                return (
                  <Tabs.Trigger key={tabName} value={tabName} css={{ gap: '$8' }}>
                    <Icon />
                    {title}
                  </Tabs.Trigger>
                );
              })}
          </Tabs.List>
          {selection && (
            <>
              {settingsList
                .filter(({ tabName }) => showSetting[tabName])
                .map(({ content: Content, title, tabName }) => {
                  return (
                    <Tabs.Content
                      key={tabName}
                      value={tabName}
                      className={settingContent()}
                      css={{
                        minWidth: 0,
                        mr: '$4',
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        width: '100%',
                        height: '100%',
                      }}
                    >
                      {/* <SettingsContentHeader onBack={resetSelection} isMobile={isMobile}>
                        {selection}
                      </SettingsContentHeader> */}
                      <Content setHide={hideSettingByTabName(tabName)} />
                    </Tabs.Content>
                  );
                })}
            </>
          )}
        </Tabs.Root>
        <Sheet.Close css={{ position: 'absolute', right: '$10', top: '$10' }}>
          <IconButton as="div" data-testid="dialog_cross_icon">
            <CrossIcon />
          </IconButton>
        </Sheet.Close>
      </Sheet.Content>
    </Sheet.Root>
  ) : (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Trigger asChild>{children}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Content
          css={{
            w: 'min(800px, 90%)',
            height: 'min(656px, 90%)',
            p: 0,
            r: '$4',
          }}
        >
          <Tabs.Root
            value={selection}
            activationMode={isMobile ? 'manual' : 'automatic'}
            onValueChange={setSelection}
            css={{ size: '100%', position: 'relative' }}
          >
            <Tabs.List
              css={{
                w: isMobile ? '100%' : '18.625rem',
                flexDirection: 'column',
                bg: '$background_default',
                p: '$14 $10',
                borderTopLeftRadius: '$4',
                borderBottomLeftRadius: '$4',
              }}
            >
              <Text variant="h5">Settings </Text>
              <Flex direction="column" css={{ mx: isMobile ? '-$8' : 0, overflowY: 'auto', pt: '$10' }}>
                {settingsList
                  .filter(({ tabName }) => showSetting[tabName])
                  .map(({ icon: Icon, tabName, title }) => {
                    return (
                      <Tabs.Trigger key={tabName} value={tabName} css={{ gap: '$8' }}>
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
                  mr: '$4',
                  ...(isMobile
                    ? {
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        bg: '$surface_default',
                        width: '100%',
                        height: '100%',
                      }
                    : {}),
                }}
              >
                {settingsList
                  .filter(({ tabName }) => showSetting[tabName])
                  .map(({ content: Content, title, tabName }) => {
                    return (
                      <Tabs.Content key={tabName} value={tabName} className={settingContent()}>
                        <SettingsContentHeader onBack={resetSelection} isMobile={isMobile}>
                          {title}
                        </SettingsContentHeader>
                        <Content setHide={hideSettingByTabName(tabName)} />
                      </Tabs.Content>
                    );
                  })}
              </Flex>
            )}
          </Tabs.Root>
          <Dialog.Close css={{ position: 'absolute', right: '$10', top: '$10' }}>
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
    <Text variant="h6" css={{ mb: '$12', display: 'flex', alignItems: 'center' }}>
      {isMobile && (
        <Box as="span" css={{ bg: '$surface_bright', mr: '$4', r: '$round', p: '$2' }} onClick={onBack}>
          <ChevronLeftIcon />
        </Box>
      )}
      {children}
    </Text>
  );
};

export default SettingsModal;
