import React, { useState } from 'react';
import { useMedia } from 'react-use';
import { selectPeerNameByID, useHMSStore } from '@100mslive/react-sdk';
import { ChevronDownIcon, ChevronUpIcon, CrossIcon, SearchIcon } from '@100mslive/react-icons';
import { Dropdown } from '../../../Dropdown';
import { Flex } from '../../../Layout';
import { Sheet } from '../../../Sheet';
import { Text } from '../../../Text';
import { config as cssConfig } from '../../../Theme';
import { ChatSelector } from './ChatSelector';
import { useRoomLayoutConferencingScreen } from '../../provider/roomLayoutProvider/hooks/useRoomLayoutScreen';
// @ts-ignore
import { useSubscribeChatSelector } from '../AppData/useUISettings';
import { useDefaultChatSelection } from '../../common/hooks';
import { textEllipsis } from '../../../utils';
import { CHAT_SELECTOR } from '../../common/constants';

export const ChatSelectorContainer = () => {
  const [open, setOpen] = useState(false);
  const isMobile = useMedia(cssConfig.media.md);
  const { elements } = useRoomLayoutConferencingScreen();
  const isPrivateChatEnabled = !!elements?.chat?.private_chat_enabled;

  const peerSelector = useSubscribeChatSelector(CHAT_SELECTOR.PEER_ID);
  const roleSelector = useSubscribeChatSelector(CHAT_SELECTOR.ROLE);
  const defaultSelection = useDefaultChatSelection();
  const selectorPeerName = useHMSStore(selectPeerNameByID(peerSelector));
  const selection = selectorPeerName || roleSelector || defaultSelection;

  if (!isPrivateChatEnabled && !selection) {
    return null;
  }
  return (
    <Flex align="center" css={{ mb: '$8', flex: '1 1 0' }}>
      <Text variant="tiny" css={{ color: '$on_surface_medium', textTransform: 'uppercase' }}>
        {selection ? 'To' : 'Choose Participant'}
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
          <Flex align="center" css={{ c: '$on_surface_medium' }} gap="1">
            {!selection && <SearchIcon width={16} height={16} />}
            <Text
              variant="tiny"
              css={{ ...textEllipsis(80), textTransform: 'uppercase', c: '$on_surface_high', pr: '$2' }}
            >
              {selection || 'Search'}
            </Text>
            {selection &&
              (open ? <ChevronUpIcon width={16} height={16} /> : <ChevronDownIcon width={16} height={16} />)}
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
          {isMobile ? (
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
                <ChatSelector role={roleSelector} peerId={peerSelector} />
              </Sheet.Content>
            </Sheet.Root>
          ) : (
            <ChatSelector role={roleSelector} peerId={peerSelector} />
          )}
        </Dropdown.Content>
      </Dropdown.Root>
    </Flex>
  );
};
