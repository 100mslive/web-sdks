import React, { useMemo, useRef } from 'react';
import {
  selectHMSMessages,
  selectLocalPeerID,
  selectSessionStore,
  useHMSActions,
  useHMSStore,
} from '@100mslive/react-sdk';
import { SendIcon } from '@100mslive/react-icons';
import { Box, Flex } from '../../../Layout';
import { Text } from '../../../Text';
import { TextArea } from '../../../TextArea';
import { Tooltip } from '../../../Tooltip';
import IconButton from '../../IconButton';
import { AnnotisedMessage, MessageType, SenderName } from '../Chat/ChatBody';
import { EmptyChat } from '../Chat/EmptyChat';
import { useRoomLayoutConferencingScreen } from '../../provider/roomLayoutProvider/hooks/useRoomLayoutScreen';
import { CHAT_MESSAGE_LIMIT, formatTime } from '../Chat/utils';
import { SESSION_STORE_KEY } from '../../common/constants';

export const PIPChat = () => {
  const messages = useHMSStore(selectHMSMessages);
  const localPeerID = useHMSStore(selectLocalPeerID);
  const blacklistedMessageIDs = useHMSStore(selectSessionStore(SESSION_STORE_KEY.CHAT_MESSAGE_BLACKLIST));
  const filteredMessages = useMemo(() => {
    const blacklistedMessageIDSet = new Set(blacklistedMessageIDs || []);
    return messages?.filter(message => message.type === 'chat' && !blacklistedMessageIDSet.has(message.id)) || [];
  }, [blacklistedMessageIDs, messages]);
  const { elements } = useRoomLayoutConferencingScreen();
  const message_placeholder = elements?.chat?.message_placeholder || 'Send a message';
  const hmsActions = useHMSActions();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const sendMessage = async () => {
    if (inputRef?.current?.value) {
      const message = inputRef.current.value;
      console.log(message);
      if (!message || !message.trim().length) {
        return;
      }
      await hmsActions.sendBroadcastMessage(message);
    }
  };

  return (
    <Box css={{ bg: '$surface_dim', overflowY: 'auto', h: '1000px', position: 'relative' }}>
      {filteredMessages.length === 0 ? (
        <EmptyChat />
      ) : (
        filteredMessages.map(message => (
          <Box style={{ margin: '8px 2px', padding: '4px' }}>
            <Flex align="center" css={{ w: '100%' }}>
              <Text
                css={{
                  color: '$on_surface_high',
                  fontWeight: '$semiBold',
                  display: 'flex',
                  alignItems: 'center',
                  alignSelf: 'stretch',
                  width: '100%',
                }}
                as="div"
              >
                <Flex align="baseline">
                  {message.senderName === 'You' || !message.senderName ? (
                    <SenderName as="span" variant="sub2" css={{ color: '$on_surface_high', fontWeight: '$semiBold' }}>
                      {message.senderName || 'Anonymous'}
                    </SenderName>
                  ) : (
                    <Tooltip title={message.senderName} side="top" align="start">
                      <SenderName as="span" variant="sub2" css={{ color: '$on_surface_high', fontWeight: '$semiBold' }}>
                        {message.sender === localPeerID ? `${message.senderName} (You)` : message.senderName}
                      </SenderName>
                    </Tooltip>
                  )}
                  <MessageType
                    hasCurrentUserSent={message.sender === localPeerID}
                    receiver={message.recipientPeer}
                    roles={message.recipientRoles}
                  />
                </Flex>

                <Text
                  as="span"
                  variant="caption"
                  css={{
                    color: '$on_surface_medium',
                    flexShrink: 0,
                    position: 'absolute',
                    right: 0,
                    zIndex: 1,
                    mr: '$4',
                    p: '$2',
                  }}
                >
                  {formatTime(message.time)}
                </Text>
              </Text>
            </Flex>
            <Text
              variant="sm"
              css={{
                w: '100%',
                mt: '$2',
                wordBreak: 'break-word',
                whiteSpace: 'pre-wrap',
                userSelect: 'all',
                color: '$on_surface_high',
              }}
            >
              <AnnotisedMessage message={message.message} />
            </Text>
          </Box>
        ))
      )}
      <Flex
        align="end"
        css={{
          bg: '$surface_default',
          minHeight: '$16',
          width: '100%',
          py: '$6',
          pl: '$8',
          flexGrow: 1,
          r: '$1',
          boxSizing: 'border-box',
        }}
      >
        <TextArea
          maxLength={CHAT_MESSAGE_LIMIT}
          css={{
            w: '100%',
            c: '$on_surface_high',
            border: 'none',
            outline: 'none',
          }}
          placeholder={message_placeholder}
          required
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
        />

        <IconButton
          className="send-msg"
          onClick={async () => sendMessage()}
          css={{
            ml: 'auto',
            height: 'max-content',
            mr: '$4',
            '&:hover': { c: '$on_surface_medium' },
          }}
          data-testid="send_msg_btn"
        >
          <SendIcon />
        </IconButton>
      </Flex>
    </Box>
  );
};
