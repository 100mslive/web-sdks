import React, { useState } from 'react';
import { useMedia } from 'react-use';
import { ChevronDownIcon, ChevronUpIcon, CrossIcon, GroupIcon, PersonIcon } from '@100mslive/react-icons';
import { Dropdown } from '../../../Dropdown';
import { Box, Flex } from '../../../Layout';
import { Sheet } from '../../../Sheet';
import { Text } from '../../../Text';
import { config as cssConfig } from '../../../Theme';
import { ChatSelector } from './ChatSelector';
import { useRoomLayoutConferencingScreen } from '../../provider/roomLayoutProvider/hooks/useRoomLayoutScreen';
// @ts-ignore
import { useSubscribeChatSelector } from '../AppData/useUISettings';
import { useDefaultChatSelection, useFilteredRoles } from '../../common/hooks';
import { CHAT_SELECTOR } from '../../common/constants';

export const ChatSelectorContainer = () => {
  const [open, setOpen] = useState(false);
  const isMobile = useMedia(cssConfig.media.md);
  const { elements } = useRoomLayoutConferencingScreen();
  const isPrivateChatEnabled = !!elements?.chat?.private_chat_enabled;
  const isPublicChatEnabled = !!elements?.chat?.public_chat_enabled;
  const roles = useFilteredRoles();
  const selectedPeer = useSubscribeChatSelector(CHAT_SELECTOR.PEER);
  const selectedRole = useSubscribeChatSelector(CHAT_SELECTOR.ROLE);
  const defaultSelection = useDefaultChatSelection();
  const selection = selectedPeer.name || selectedRole || defaultSelection;

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
              variant="caption"
              css={{
                c: '$on_surface_high',
                pr: '$2',
                display: 'flex',
                alignItems: 'center',
                gap: '$1',
                textTransform: selection !== selectedPeer.name ? 'capitalize' : undefined,
              }}
            >
              {selection === CHAT_SELECTOR.EVERYONE ? (
                <GroupIcon width={16} height={16} />
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
                background: '$primary_default',
                c: '$on_primary_high',
                r: '$0',
                p: '$1 $2',
                ml: '$6',
              }}
              tabIndex={0}
            >
              <Flex align="center" gap="1">
                <Text
                  variant="caption"
                  css={{
                    c: 'inherit',
                    pr: '$2',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '$1',
                    textTransform: selection !== selectedPeer.name ? 'capitalize' : undefined,
                  }}
                >
                  {selection === CHAT_SELECTOR.EVERYONE ? (
                    <GroupIcon width={16} height={16} />
                  ) : (
                    <PersonIcon width={16} height={16} />
                  )}
                  {selection || 'Search'}
                </Text>
                {selection && (
                  <ChevronDownIcon
                    style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 150ms ease' }}
                    width={12}
                    height={12}
                  />
                )}
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
              <ChatSelector role={selectedRole} peerId={selectedPeer.id} />
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
              <ChatSelector role={selectedRole} peerId={selectedPeer.id} />
            </Box>
          </Sheet.Content>
        </Sheet.Root>
      ) : null}
    </>
  );
};
