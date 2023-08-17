import { Flex } from '../../../Layout';
import { Text } from '../../../Text';
import { Dropdown } from '../../../Dropdown';
import { ChatSelector } from './ChatSelector';
import { textEllipsis } from '../../../utils';
import React, { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon, CrossIcon } from '@100mslive/react-icons';
import { useMedia } from 'react-use';
import { config as cssConfig } from '../../../Theme';
import { useShowStreamingUI } from '../../common/hooks';
import { Sheet } from '../../../Sheet';

export const ChatSelectorContainer = ({ onSelect, role, peerId, selection }) => {
  const [open, setOpen] = useState(false);
  const isMobile = useMedia(cssConfig.media.md);
  const showStreamingUI = useShowStreamingUI();

  return (
    <Flex align="center" css={{ mb: '$8' }}>
      <Text variant="tiny" css={{ color: '$on_surface_medium', textTransform: 'uppercase' }}>
        Send To
      </Text>

      <Dropdown.Root open={open} onOpenChange={value => setOpen(value)}>
        <Dropdown.Trigger
          asChild
          data-testid="participant_list_filter"
          css={{
            border: '1px solid $border_bright',
            r: '$0',
            p: '$1 $2',
            ml: '$8',
          }}
          tabIndex={0}
        >
          <Flex align="center" css={{ c: '$on_surface_medium' }}>
            <Text variant="tiny" css={{ ...textEllipsis(80), textTransform: 'uppercase', c: '$on_surface_high' }}>
              {selection}
            </Text>
            {open ? <ChevronUpIcon width={16} height={16} /> : <ChevronDownIcon width={16} height={16} />}
          </Flex>
        </Dropdown.Trigger>

        <Dropdown.Content
          css={{
            w: '$64',
            overflow: 'hidden',
            maxHeight: 'unset',
            bg: '$surface_default',
          }}
          align="start"
          sideOffset={8}
        >
          {isMobile && showStreamingUI ? (
            <Sheet.Root open={open} onOpenChange={value => setOpen(value)}>
              <Sheet.Content css={{ pt: '$8' }}>
                <Sheet.Title
                  css={{
                    display: 'flex',
                    w: '100%',
                    justifyContent: 'space-between',
                    px: '$10',
                    pb: '$4',
                    mb: '$8',
                    borderBottom: '1px solid $border_bright',
                  }}
                >
                  <Text css={{ color: '$on_surface_medium', fontWeight: '$semiBold' }}>Send message to</Text>
                  <Sheet.Close css={{ color: '$on_surface_medium' }}>
                    <CrossIcon />
                  </Sheet.Close>
                </Sheet.Title>
                <ChatSelector onSelect={onSelect} role={role} peerId={peerId} />
              </Sheet.Content>
            </Sheet.Root>
          ) : (
            <ChatSelector onSelect={onSelect} role={role} peerId={peerId} />
          )}
        </Dropdown.Content>
      </Dropdown.Root>
    </Flex>
  );
};
