import React from 'react';
import { selectLocalPeer, selectSessionStore, useHMSActions, useHMSStore } from '@100mslive/react-sdk';
import { PauseCircleIcon, SettingsIcon } from '@100mslive/react-icons';
import { Flex } from '../../Layout';
import { Popover } from '../../Popover';
import { Text } from '../../Text';
import { useRoomLayoutConferencingScreen } from '../provider/roomLayoutProvider/hooks/useRoomLayoutScreen';
import { SESSION_STORE_KEY } from '../common/constants';

export const ChatSettings = () => {
  const hmsActions = useHMSActions();
  const localPeer = useHMSStore(selectLocalPeer);
  const { elements } = useRoomLayoutConferencingScreen();
  const canPauseChat = !!elements?.chat?.real_time_controls?.can_disable_chat;
  const { enabled: isChatEnabled = true } = useHMSStore(selectSessionStore(SESSION_STORE_KEY.CHAT_STATE)) || {};
  const showPause = canPauseChat && isChatEnabled;

  if (!showPause) {
    return null;
  }

  return (
    <Popover.Root>
      <Popover.Trigger asChild css={{ px: '4' }}>
        <Flex
          align="center"
          css={{ color: 'onSurface.medium', '&:hover': { color: 'onSurface.high' }, cursor: 'pointer' }}
        >
          <SettingsIcon />
        </Flex>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          side="bottom"
          sideOffset={2}
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
            backgroundColor: 'surface.default',
            display: 'flex',
            alignItems: 'center',
            gap: '4',
            borderRadius: '1',
            color: 'onSurface.high',
            cursor: 'pointer',
            '&:hover': { backgroundColor: 'surface.dim' },
          }}
        >
          <PauseCircleIcon />
          <Text variant="sm" css={{ fontWeight: 'semiBold' }}>
            Pause Chat
          </Text>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};
