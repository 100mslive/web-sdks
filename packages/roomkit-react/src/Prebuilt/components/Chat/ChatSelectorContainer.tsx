import React, { useState } from 'react';
import { useMedia } from 'react-use';
import { selectPeerNameByID, useHMSStore } from '@100mslive/react-sdk';
import { ChevronDownIcon, ChevronUpIcon, CrossIcon, PeopleIcon, PersonIcon } from '@100mslive/react-icons';
import { Dropdown } from '../../../Dropdown';
import { Box, Flex } from '../../../Layout';
import { Sheet } from '../../../Sheet';
import { Text } from '../../../Text';
import { config as cssConfig } from '../../../Theme';
import { ChatSelector } from './ChatSelector';
import { useRoomLayoutConferencingScreen } from '../../provider/roomLayoutProvider/hooks/useRoomLayoutScreen';
// @ts-ignore
import { useSubscribeChatSelector } from '../AppData/useUISettings';
import { useFilteredRoles } from '../../common/hooks';
import { CHAT_SELECTOR } from '../../common/constants';

export const ChatSelectorContainer = () => {
  const [open, setOpen] = useState(false);
  const isMobile = useMedia(cssConfig.media.md);
  const { elements } = useRoomLayoutConferencingScreen();
  const isPrivateChatEnabled = !!elements?.chat?.private_chat_enabled;
  const isPublicChatEnabled = !!elements?.chat?.public_chat_enabled;
  const roles = useFilteredRoles();
  const selectedPeer = useSubscribeChatSelector(CHAT_SELECTOR.PEER_ID);
  const selectedRole = useSubscribeChatSelector(CHAT_SELECTOR.ROLE);
  const selectorPeerName = useHMSStore(selectPeerNameByID(selectedPeer));
  const selection = selectorPeerName || selectedRole || CHAT_SELECTOR.EVERYONE;

  if (!(isPrivateChatEnabled || isPublicChatEnabled || roles.length > 0) && !isPrivateChatEnabled && !selection) {
    return null;
  }
  return (
    <>
      <Flex align="center" css={{ mb: '$8', flex: '1 1 0', pl: '$2' }}>
        <Text variant="xs" css={{ color: '$on_surface_medium' }}>
          {selection ? 'To' : 'Choose Participant'}
        </Text>

        {isMobile ? (
          <Flex
            align="center"
            css={{ c: '$on_surface_medium', border: '1px solid $border_bright', r: '$0', p: '$1 $2', ml: '$6' }}
            gap="1"
            onClick={e => {
              setOpen(value => !value);
              e.stopPropagation();
            }}
          >
            <Text
              variant="xs"
              css={{
                c: '$on_surface_high',
                pr: '$2',
                display: 'flex',
                alignItems: 'center',
                gap: '$1',
                textTransform: 'capitalize',
              }}
            >
              {selection === CHAT_SELECTOR.EVERYONE ? (
                <PeopleIcon width={16} height={16} />
              ) : (
                <PersonIcon width={16} height={16} />
              )}
              {selection || 'Search'}
            </Text>
            {selection &&
              (open ? <ChevronUpIcon width={16} height={16} /> : <ChevronDownIcon width={16} height={16} />)}
          </Flex>
        ) : (
          <Dropdown.Root open={open} onOpenChange={value => setOpen(value)}>
            <Dropdown.Trigger
              asChild
              data-testid="participant_list_filter"
              css={{
                border: '1px solid $border_bright',
                r: '$0',
                p: '$1 $2',
                ml: '$6',
              }}
              tabIndex={0}
            >
              <Flex align="center" css={{ c: '$on_surface_medium' }} gap="1">
                <Text variant="tiny" css={{ textTransform: 'uppercase', c: '$on_surface_high', pr: '$2' }}>
                  {selection}
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
              <ChatSelector role={selectedRole} peerId={selectedPeer} />
            </Dropdown.Content>
          </Dropdown.Root>
        )}
      </Flex>
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
              <Text css={{ color: '$on_surface_medium', fontWeight: '$semiBold' }}>Chat with</Text>
              <Sheet.Close css={{ color: '$on_surface_medium' }}>
                <CrossIcon />
              </Sheet.Close>
            </Sheet.Title>
            <Box
              onClick={() => {
                setOpen(false);
              }}
            >
              <ChatSelector role={selectedRole} peerId={selectedPeer} />
            </Box>
          </Sheet.Content>
        </Sheet.Root>
      ) : null}
    </>
  );
};
