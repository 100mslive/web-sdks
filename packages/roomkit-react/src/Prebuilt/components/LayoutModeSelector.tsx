import React, { useState } from 'react';
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from '@100mslive/react-icons';
import { LayoutMode, LayoutModeIconMapping, LayoutModeKeys } from './Settings/LayoutSettings';
import { Dropdown } from '../../Dropdown';
import { Box, Flex } from '../../Layout';
import { Text } from '../../Text';
// @ts-ignore: No implicit Any
import { useSetUiSettings } from '../components/AppData/useUISettings';
import { UI_SETTINGS } from '../common/constants';

export const LayoutModeSelector = () => {
  const [open, setOpen] = useState(false);
  const [layoutMode, setLayoutMode] = useSetUiSettings(UI_SETTINGS.layoutMode);

  return (
    <Dropdown.Root open={open} onOpenChange={setOpen}>
      <Dropdown.Trigger asChild>
        <Flex align="center" css={{ gap: '$2', color: '$on_surface_low', r: '$1', p: '$2 $4' }}>
          <Text css={{ gap: '$4', display: 'flex', color: '$on_surface_low' }}>
            {LayoutModeIconMapping[layoutMode as LayoutModeKeys]} {layoutMode}
          </Text>
          {open ? <ChevronUpIcon width={16} height={16} /> : <ChevronDownIcon width={16} height={16} />}
        </Flex>
      </Dropdown.Trigger>
      <Dropdown.Portal>
        <Dropdown.Content css={{ p: 0, w: '10.75rem' }} side="bottom" sideOffset={16} align="end">
          {Object.keys(LayoutMode).map(key => {
            const value = LayoutMode[key as LayoutModeKeys];
            return (
              <Dropdown.Item
                key={key}
                onClick={() => setLayoutMode(value)}
                css={{ gap: '$4', borderBottom: '1px solid $border_bright', fontSize: '$space$6' }}
              >
                <Box css={{ w: '$9', h: '$9' }}>{LayoutModeIconMapping[value]}</Box>
                {value}
                {value === layoutMode ? <CheckIcon width={20} height={20} style={{ marginLeft: 'auto' }} /> : null}
              </Dropdown.Item>
            );
          })}
        </Dropdown.Content>
      </Dropdown.Portal>
    </Dropdown.Root>
  );
};
