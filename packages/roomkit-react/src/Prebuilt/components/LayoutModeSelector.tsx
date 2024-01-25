import React, { useState } from 'react';
import { LayoutMode, LayoutModeIconMapping, LayoutModeKeys } from './Settings/LayoutSettings';
import { Dropdown } from '../../Dropdown';
import { Flex } from '../../Layout';
// @ts-ignore: No implicit Any
import { useSetUiSettings } from '../components/AppData/useUISettings';
import { UI_SETTINGS } from '../common/constants';

export const LayoutModeSelector = () => {
  const [open, setOpen] = useState(false);
  const [layoutMode, setLayoutMode] = useSetUiSettings(UI_SETTINGS.layoutMode);
  return (
    <Dropdown.Root open={open} onOpenChange={setOpen} modal={false}>
      <Dropdown.Trigger asChild>
        <Flex css={{ gap: '$4' }}>
          {LayoutModeIconMapping[layoutMode as LayoutModeKeys]} {LayoutMode[layoutMode as LayoutModeKeys]}
        </Flex>
      </Dropdown.Trigger>
      <Dropdown.Content css={{ p: 0, w: '$100' }} alignOffset={-50} sideOffset={10}>
        {Object.keys(LayoutMode).map(key => {
          return (
            <Dropdown.Item key={key} onClick={() => setLayoutMode(key)}>
              {LayoutModeIconMapping[key as LayoutModeKeys]}
              {LayoutMode[key as LayoutModeKeys]}
            </Dropdown.Item>
          );
        })}
      </Dropdown.Content>
    </Dropdown.Root>
  );
};
