import React from 'react';
import { selectLocalPeer, useHMSActions, useHMSStore } from '@100mslive/react-sdk';
import { PauseCircleIcon, SettingsIcon } from '@100mslive/react-icons';
import { Flex } from '../../Layout';
import { Popover } from '../../Popover';
import { Text } from '../../Text';
import { SESSION_STORE_KEY } from '../common/constants';

export const ChatSettings = () => {
  const hmsActions = useHMSActions();
  const localPeer = useHMSStore(selectLocalPeer);
  return (
    <Popover.Root>
      <Popover.Trigger asChild css={{ px: '$4' }}>
        <Flex
          align="center"
          css={{ color: '$on_surface_medium', '&:hover': { color: '$on_surface_high' }, cursor: 'pointer' }}
        >
          <SettingsIcon />
        </Flex>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          side="bottom"
          sideOffset={4}
          onClick={() => {
            const chatState = {
              enabled: false,
              updatedBy: {
                peerId: localPeer?.id,
                userId: localPeer?.customerUserId,
                userName: localPeer?.name,
              },
              updatedAt: Date.now(),
            };
            hmsActions.sessionStore.set(SESSION_STORE_KEY.CHAT_STATE, chatState);
          }}
          css={{
            backgroundColor: '$surface_default',
            display: 'flex',
            alignItems: 'center',
            gap: '$4',
            borderRadius: '$1',
            color: '$on_surface_high',
            cursor: 'pointer',
            '&:hover': { backgroundColor: '$surface_dim' },
          }}
        >
          <PauseCircleIcon />
          <Text variant="sm" css={{ fontWeight: '$semiBold' }}>
            Pause Chat
          </Text>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};
