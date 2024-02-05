import React, { useCallback } from 'react';
import { selectIsLocalScreenShared, selectIsLocalVideoEnabled, useHMSActions, useHMSStore } from '@100mslive/react-sdk';
import { GalleryIcon, PersonRectangleIcon, SidebarIcon } from '@100mslive/react-icons';
import { Box, Flex, Slider, Text } from '../../..';
import SwitchWithLabel from './SwitchWithLabel';
// @ts-ignore: No implicit Any
import { useSetUiSettings } from '../AppData/useUISettings';
import { settingOverflow } from './common';
import { UI_SETTINGS } from '../../common/constants';

export const LayoutMode = {
  SIDEBAR: 'Sidebar',
  GALLERY: 'Gallery',
  SPOTLIGHT: 'Spotlight',
};

export type LayoutModeKeys = keyof typeof LayoutMode;

export const LayoutModeIconMapping = {
  [LayoutMode.GALLERY]: <GalleryIcon />,
  [LayoutMode.SIDEBAR]: <SidebarIcon />,
  [LayoutMode.SPOTLIGHT]: <PersonRectangleIcon />,
};

export const LayoutSettings = () => {
  const hmsActions = useHMSActions();
  const isLocalVideoEnabled = useHMSStore(selectIsLocalVideoEnabled);
  const isLocalScreenShared = useHMSStore(selectIsLocalScreenShared);
  const [{ isAudioOnly, maxTileCount, mirrorLocalVideo }, setUISettings] = useSetUiSettings();
  const toggleIsAudioOnly = useCallback(
    async (isAudioOnlyModeOn?: boolean) => {
      if (isAudioOnlyModeOn) {
        // turn off video and screen share if user switches to audio only mode
        isLocalVideoEnabled && (await hmsActions.setLocalVideoEnabled(false));
        isLocalScreenShared && (await hmsActions.setScreenShareEnabled(false));
      }
      setUISettings({ [UI_SETTINGS.isAudioOnly]: isAudioOnlyModeOn });
    },
    [hmsActions, isLocalVideoEnabled, isLocalScreenShared, setUISettings],
  );

  return (
    <Box className={settingOverflow()}>
      <Box>
        {/* <Text variant="md" css={{ fontWeight: '$semiBold' }}>
          Layout Modes
        </Text>
         <RadioGroup.Root
          css={{ flexDirection: 'column', alignItems: 'start', gap: '$10', my: '$2', py: '$8' }}
          value={layoutMode}
          onValueChange={value =>
            setUISettings({
              [UI_SETTINGS.layoutMode]: value,
            })
          }
        >
          {Object.keys(LayoutMode).map(key => {
            return (
              <Flex align="center" key={key} css={{ mr: '$8', gap: '$8' }}>
                <RadioGroup.Item value={LayoutMode[key as LayoutModeKeys]} id={`layoutMode-${key}`} css={{ mr: '$4' }}>
                  <RadioGroup.Indicator />
                </RadioGroup.Item>
                <Label htmlFor={`layoutMode-${key}`} css={{ display: 'flex', gap: '$8', cursor: 'pointer' }}>
                  {LayoutModeIconMapping[LayoutMode[key as LayoutModeKeys]]}
                  {LayoutMode[key as LayoutModeKeys]}
                </Label>
              </Flex>
            );
          })}
        </RadioGroup.Root> */}
      </Box>
      <Flex align="center" css={{ w: '100%', my: '$2', py: '$8', '@md': { display: 'none' } }}>
        <Text variant="md" css={{ fontWeight: '$semiBold' }}>
          Tiles In View({maxTileCount})
        </Text>
        <Flex justify="end" css={{ flex: '1 1 0' }}>
          <Slider
            step={1}
            value={[maxTileCount]}
            min={1}
            max={49}
            onValueChange={e => {
              setUISettings({ [UI_SETTINGS.maxTileCount]: e[0] });
            }}
            css={{ w: '70%' }}
          />
        </Flex>
      </Flex>
      <SwitchWithLabel label="Audio Only Mode" id="audioOnlyMode" checked={isAudioOnly} onChange={toggleIsAudioOnly} />
      <SwitchWithLabel
        label="Mirror Local Video"
        id="mirrorMode"
        checked={mirrorLocalVideo}
        onChange={value => {
          setUISettings({
            [UI_SETTINGS.mirrorLocalVideo]: value,
          });
        }}
      />
    </Box>
  );
};
