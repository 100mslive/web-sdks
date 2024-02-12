import React, { useState } from 'react';
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from '@100mslive/react-icons';
import { LayoutMode, LayoutModeIconMapping, LayoutModeKeys } from './Settings/LayoutSettings';
import { Flex } from '../../Layout';
import { Popover } from '../../Popover';
import { Text } from '../../Text';
// @ts-ignore: No implicit Any
import { useSetUiSettings } from '../components/AppData/useUISettings';
import { UI_SETTINGS } from '../common/constants';

export const LayoutModeSelector = () => {
  const [open, setOpen] = useState(false);
  const [layoutMode, setLayoutMode] = useSetUiSettings(UI_SETTINGS.layoutMode);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <Flex
          align="center"
          css={{
            gap: '$4',
            color: open ? '$on_surface_low' : '$on_surface_medium',
            r: '$1',
            p: '$2 $4',
            height: '100%',
          }}
        >
          <Flex
            align="center"
            justify="center"
            css={{
              color: 'inherit',
              '& > svg': {
                w: '$9',
                h: '$9',
              },
            }}
          >
            {LayoutModeIconMapping[layoutMode as LayoutModeKeys]}
          </Flex>
          <Text variant="caption" css={{ color: 'inherit', lineHeight: '$sm' }}>
            {layoutMode}
          </Text>
          {open ? <ChevronUpIcon width={16} height={16} /> : <ChevronDownIcon width={16} height={16} />}
        </Flex>
      </Popover.Trigger>
      <Popover.Content
        css={{
          w: '10.75rem',
          r: '$1',
          py: '$4',
          px: 0,
          backgroundColor: '$surface_default',
          overflowY: 'auto',
          boxShadow: '0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)',
          fontFamily: '$sans',
          color: '$on_surface_high',
        }}
        side="bottom"
        sideOffset={8}
        align="end"
      >
        {Object.keys(LayoutMode).map(key => {
          const value = LayoutMode[key as LayoutModeKeys];
          return (
            <Flex
              key={key}
              onClick={() => setLayoutMode(value)}
              align="center"
              css={{
                gap: '$4',
                borderBottom: '1px solid $border_bright',
                p: '$8',
                '&:hover': {
                  cursor: 'pointer',
                  bg: '$surface_bright',
                },
                '&:focus-visible': {
                  bg: '$surface_bright',
                },
              }}
            >
              <Flex
                align="center"
                justify="center"
                css={{
                  color: '$on_surface_medium',
                  '& > svg': {
                    w: '$9',
                    h: '$9',
                  },
                }}
              >
                {LayoutModeIconMapping[value]}
              </Flex>
              <Text variant="caption" css={{ lineHeight: '$sm' }}>
                {value}
              </Text>
              {value === layoutMode ? <CheckIcon width={20} height={20} style={{ marginLeft: 'auto' }} /> : null}
            </Flex>
          );
        })}
      </Popover.Content>
    </Popover.Root>
  );
};
