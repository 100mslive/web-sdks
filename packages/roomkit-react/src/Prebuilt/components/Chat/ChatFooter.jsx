import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useMedia } from 'react-use';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { useHMSActions } from '@100mslive/react-sdk';
import { EmojiIcon, SendIcon } from '@100mslive/react-icons';
import { Box, config as cssConfig, Flex, IconButton as BaseIconButton, Popover, styled } from '../../../';
import { ToastManager } from '../Toast/ToastManager';
import { ChatSelectorContainer } from './ChatSelectorContainer';
import { useChatDraftMessage } from '../AppData/useChatState';
import { useEmojiPickerStyles } from './useEmojiPickerStyles';
import { useIsLocalPeerHLSViewer, useShowStreamingUI } from '../../common/hooks';

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

function EmojiPicker({ onSelect }) {
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

export const ChatFooter = ({ role, peerId, onSend, children, onSelect, selection }) => {
  const hmsActions = useHMSActions();
  const inputRef = useRef(null);
  const [draftMessage, setDraftMessage] = useChatDraftMessage();
  const isMobile = useMedia(cssConfig.media.md);
  const isHLSViewer = useIsLocalPeerHLSViewer();
  const showStreamingUI = useShowStreamingUI();

  const sendMessage = useCallback(async () => {
    const message = inputRef.current.value;
    if (!message || !message.trim().length) {
      return;
    }
    try {
      if (role) {
        await hmsActions.sendGroupMessage(message, [role]);
      } else if (peerId) {
        await hmsActions.sendDirectMessage(message, peerId);
      } else {
        await hmsActions.sendBroadcastMessage(message);
      }
      inputRef.current.value = '';
      setTimeout(() => {
        onSend();
      }, 0);
    } catch (error) {
      ToastManager.addToast({ title: error.message });
    }
  }, [role, peerId, hmsActions, onSend]);

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
    <>
      {!isHLSViewer ? (
        <ChatSelectorContainer onSelect={onSelect} role={role} peerId={peerId} selection={selection} />
      ) : null}
      <Flex align="center" css={{ gap: '$4', w: '100%' }}>
        <Flex
          align="center"
          css={{
            bg: (showStreamingUI || isHLSViewer) && isMobile ? '$surface_dim' : '$surface_default',
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
            placeholder="Send a message...."
            ref={inputRef}
            autoFocus
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
                inputRef.current.value += ` ${emoji.native} `;
              }}
            />
          ) : null}
          <BaseIconButton
            onClick={sendMessage}
            css={{ ml: 'auto', height: 'max-content', mr: '$4', color: '$on_surface_low' }}
            data-testid="send_msg_btn"
          >
            <SendIcon />
          </BaseIconButton>
        </Flex>
      </Flex>
    </>
  );
};
