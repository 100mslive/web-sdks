import React from 'react';
import { Box, Flex, Slider, Text } from '../../../';
import SwitchWithLabel from './SwitchWithLabel';
import { useSetUiSettings } from '../AppData/useUISettings';
import { settingOverflow } from './common.js';
import { UI_SETTINGS } from '../../common/constants';

export const LayoutSettings = () => {
  const [{ maxTileCount, mirrorLocalVideo }, setUISettings] = useSetUiSettings();

  return (
    <Box className={settingOverflow()}>
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
    </Box>
  );
};
