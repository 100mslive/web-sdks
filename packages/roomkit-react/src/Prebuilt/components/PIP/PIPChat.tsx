import React, { useMemo } from 'react';
import { selectHMSMessages, selectLocalPeerID, selectSessionStore, useHMSStore } from '@100mslive/react-sdk';
import { SendIcon } from '@100mslive/react-icons';
import { Box, Flex } from '../../../Layout';
import { Text } from '../../../Text';
import { TextArea } from '../../../TextArea';
import { Tooltip } from '../../../Tooltip';
import IconButton from '../../IconButton';
import { AnnotisedMessage, MessageType, SenderName } from '../Chat/ChatBody';
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

  return (
    <div style={{ height: '100%' }}>
      <Box
        css={{
          bg: '$surface_dim',
          overflowY: 'auto',
          h: 'calc(500px - 78px)',
          position: 'relative',
        }}
      >
        {filteredMessages.length === 0 ? (
          <div
            style={{ display: 'flex', height: '100%', width: '100%', alignItems: 'center', justifyContent: 'center' }}
          >
            <Text>No messages here yet</Text>
          </div>
        ) : (
          filteredMessages.map(message => (
            <Box key={message.id} style={{ padding: '8px' }}>
              <Flex align="center" css={{ w: '100%' }}>
                <Text
                  style={{ display: 'flex', alignItems: 'between', alignSelf: 'stretch', width: '100%' }}
                  css={{
                    color: '$on_surface_high',
                    fontWeight: '$semiBold',
                  }}
                >
                  <Flex align="baseline">
                    {message.senderName === 'You' || !message.senderName ? (
                      <SenderName as="span" variant="sub2" css={{ color: '$on_surface_high', fontWeight: '$semiBold' }}>
                        {message.senderName || 'Anonymous'}
                      </SenderName>
                    ) : (
                      <Tooltip title={message.senderName} side="top" align="start">
                        <SenderName
                          as="span"
                          variant="sub2"
                          css={{ color: '$on_surface_high', fontWeight: '$semiBold' }}
                        >
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
                    variant="xs"
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
        <div id="marker" style={{ height: filteredMessages.length ? '1px' : 0 }} />
      </Box>
      <Flex
        align="center"
        css={{
          bg: '$surface_default',
          minHeight: '$16',
          width: '100%',
          py: '$6',
          pl: '$8',
          boxSizing: 'border-box',
          gap: '$2',
        }}
      >
        <TextArea
          maxLength={CHAT_MESSAGE_LIMIT}
          style={{ border: 'none', resize: 'none' }}
          css={{
            w: '100%',
            c: '$on_surface_high',
          }}
          placeholder={message_placeholder}
          required
          autoComplete="off"
          aria-autocomplete="none"
        />

        <IconButton
          className="send-msg"
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
    </div>
  );
};
