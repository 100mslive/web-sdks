import React, { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { useMedia } from 'react-use';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { selectLocalPeer, selectPeerNameByID, useHMSActions, useHMSStore } from '@100mslive/react-sdk';
import { EmojiIcon, PauseCircleIcon, SendIcon, VerticalMenuIcon } from '@100mslive/react-icons';
import { Box, config as cssConfig, Flex, IconButton as BaseIconButton, Popover, styled, Text } from '../../..';
import { IconButton } from '../../../IconButton';
// @ts-ignore
import { ToastManager } from '../Toast/ToastManager';
import { ChatSelectorContainer } from './ChatSelectorContainer';
import { useRoomLayoutConferencingScreen } from '../../provider/roomLayoutProvider/hooks/useRoomLayoutScreen';
// import { ChatSelectorContainer } from './ChatSelectorContainer';
// @ts-ignore
import { useChatDraftMessage } from '../AppData/useChatState';
// @ts-ignore
import { useSubscribeChatSelector } from '../AppData/useUISettings';
// @ts-ignore
import { useEmojiPickerStyles } from './useEmojiPickerStyles';
import { CHAT_SELECTOR, SESSION_STORE_KEY } from '../../common/constants';

const TextArea = styled('textarea', {
  width: '100%',
  bg: 'transparent',
  color: '$on_primary_high',
  resize: 'none',
  lineHeight: '1rem',
  position: 'relative',
  fontFamily: '$sans',
  fontSize: '100%',
  margin: 0,
  padding: 0,
  top: '$3',
  '&:focus': {
    boxShadow: 'none',
    outline: 'none',
  },
});

function EmojiPicker({ onSelect }: { onSelect: (emoji: any) => void }) {
  const [showEmoji, setShowEmoji] = useState(false);
  const ref = useEmojiPickerStyles(showEmoji);
  return (
    <Popover.Root open={showEmoji} onOpenChange={setShowEmoji}>
      <Popover.Trigger asChild css={{ appearance: 'none' }}>
        <BaseIconButton as="div">
          <EmojiIcon />
        </BaseIconButton>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          alignOffset={-40}
          sideOffset={16}
          align="end"
          css={{
            p: 0,
          }}
        >
          <Box
            css={{
              minWidth: 352,
              minHeight: 435,
            }}
            ref={ref}
          >
            <Picker onEmojiSelect={onSelect} data={data} previewPosition="none" skinPosition="search" />
          </Box>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

export const ChatFooter = ({ onSend, children }: { onSend: () => void; children: ReactNode }) => {
  const hmsActions = useHMSActions();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [draftMessage, setDraftMessage] = useChatDraftMessage();
  const isMobile = useMedia(cssConfig.media.md);
  const { elements } = useRoomLayoutConferencingScreen();
  const message_placeholder = elements?.chat?.message_placeholder || 'Send a message';
  const localPeer = useHMSStore(selectLocalPeer);
  const isOverlayChat = elements?.chat?.is_overlay;
  const can_disable_chat = !!elements?.chat?.real_time_controls?.can_disable_chat;
  const isPublicChatEnabled = !!elements?.chat?.public_chat_enabled;
  const selectedPeer = useSubscribeChatSelector(CHAT_SELECTOR.PEER_ID);
  const selectedRole = useSubscribeChatSelector(CHAT_SELECTOR.ROLE);
  const selectorPeerName = useHMSStore(selectPeerNameByID(selectedPeer));
  const selection = selectorPeerName || selectedRole || CHAT_SELECTOR.EVERYONE;
  const sendMessage = useCallback(async () => {
    const message = inputRef?.current?.value;
    if (!message || !message.trim().length) {
      return;
    }
    try {
      if (selectedRole) {
        await hmsActions.sendGroupMessage(message, [selectedRole]);
      } else if (selectedPeer) {
        await hmsActions.sendDirectMessage(message, selectedPeer);
      } else {
        await hmsActions.sendBroadcastMessage(message);
      }
      inputRef.current.value = '';
      setTimeout(() => {
        onSend();
      }, 0);
    } catch (error) {
      const err = error as Error;
      ToastManager.addToast({ title: err.message });
    }
  }, [selectedRole, selectedPeer, hmsActions, onSend]);

  useEffect(() => {
    const messageElement = inputRef.current;
    if (messageElement) {
      messageElement.value = draftMessage;
    }
  }, [draftMessage]);

  useEffect(() => {
    const messageElement = inputRef.current;
    return () => {
      setDraftMessage(messageElement?.value || '');
    };
  }, [setDraftMessage]);

  return (
    <Box>
      <Flex>
        <ChatSelectorContainer />
        {can_disable_chat ? (
          <Flex align="center" justify="end" css={{ mb: '$4' }}>
            <Popover.Root>
              <Popover.Trigger asChild>
                <IconButton css={{ border: '1px solid $border_bright' }}>
                  <VerticalMenuIcon height="16" width="16" />
                </IconButton>
              </Popover.Trigger>
              <Popover.Portal>
                <Popover.Content
                  align="end"
                  side="top"
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
          </Flex>
        ) : null}
      </Flex>
      {!(selection === CHAT_SELECTOR.EVERYONE && !isPublicChatEnabled) && (
        <Flex align="center" css={{ gap: '$4', w: '100%' }}>
          <Flex
            align="center"
            css={{
              bg: isOverlayChat && isMobile ? '$surface_dim' : '$surface_default',
              minHeight: '$16',
              maxHeight: '$24',
              position: 'relative',
              py: '$6',
              pl: '$8',
              flexGrow: 1,
              r: '$1',
              '@md': {
                minHeight: 'unset',
                h: '$14',
                boxSizing: 'border-box',
              },
            }}
          >
            {children}
            <TextArea
              css={{
                c: '$on_surface_high',
                '&:valid ~ .send-msg': { color: '$on_surface_high' },
                '& ~ .send-msg': { color: '$on_surface_low' },
                '&::placeholder': { color: '$on_surface_medium' },
              }}
              placeholder={message_placeholder}
              ref={inputRef}
              required
              autoFocus={!isMobile}
              onKeyPress={async event => {
                if (event.key === 'Enter') {
                  if (!event.shiftKey) {
                    event.preventDefault();
                    await sendMessage();
                  }
                }
              }}
              autoComplete="off"
              aria-autocomplete="none"
              onPaste={e => e.stopPropagation()}
              onCut={e => e.stopPropagation()}
              onCopy={e => e.stopPropagation()}
            />
            {!isMobile ? (
              <EmojiPicker
                onSelect={emoji => {
                  if (inputRef.current) {
                    inputRef.current.value += ` ${emoji.native} `;
                  }
                }}
              />
            ) : null}
            <BaseIconButton
              className="send-msg"
              onClick={sendMessage}
              css={{
                ml: 'auto',
                height: 'max-content',
                mr: '$4',
                '&:hover': { c: isMobile ? '' : '$on_surface_medium' },
              }}
              data-testid="send_msg_btn"
            >
              <SendIcon />
            </BaseIconButton>
          </Flex>
        </Flex>
      )}
    </Box>
  );
};
