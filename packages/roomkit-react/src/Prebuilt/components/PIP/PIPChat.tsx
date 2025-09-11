import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  selectHMSMessages,
  selectLocalPeerID,
  selectPeerNameByID,
  selectSessionStore,
  selectUnreadHMSMessagesCount,
  useHMSStore,
} from '@100mslive/react-sdk';
import { SendIcon } from '@100mslive/react-icons';
import { Box, Flex } from '../../../Layout';
import { Text } from '../../../Text';
import { TextArea } from '../../../TextArea';
import { Tooltip } from '../../../Tooltip';
import IconButton from '../../IconButton';
import { AnnotisedMessage } from '../Chat/ChatBody';
import { useRoomLayoutConferencingScreen } from '../../provider/roomLayoutProvider/hooks/useRoomLayoutScreen';
import { useIsPeerBlacklisted } from '../hooks/useChatBlacklist';
import { CHAT_MESSAGE_LIMIT, formatTime } from '../Chat/utils';
import { SESSION_STORE_KEY } from '../../common/constants';

export const PIPChat = () => {
  const messages = useHMSStore(selectHMSMessages);
  const localPeerID = useHMSStore(selectLocalPeerID);
  const count = useHMSStore(selectUnreadHMSMessagesCount);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);

  const getSenderName = useCallback(
    (senderName: string, senderID?: string) => {
      const slicedName = senderName.length > 10 ? senderName.slice(0, 10) + '...' : senderName;
      return slicedName + (senderID === localPeerID ? ' (You)' : '');
    },
    [localPeerID],
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setUnreadMessageCount(count);
    }, 100);
    return () => clearTimeout(timeoutId);
  }, [count]);

  const blacklistedMessageIDs = useHMSStore(selectSessionStore(SESSION_STORE_KEY.CHAT_MESSAGE_BLACKLIST));
  const filteredMessages = useMemo(() => {
    const blacklistedMessageIDSet = new Set(blacklistedMessageIDs || []);
    return messages?.filter(message => message.type === 'chat' && !blacklistedMessageIDSet.has(message.id)) || [];
  }, [blacklistedMessageIDs, messages]);
  const { enabled: isChatEnabled = true, updatedBy: chatStateUpdatedBy = '' } =
    useHMSStore(selectSessionStore(SESSION_STORE_KEY.CHAT_STATE)) || {};
  const isLocalPeerBlacklisted = useIsPeerBlacklisted({ local: true });
  const { elements } = useRoomLayoutConferencingScreen();
  const message_placeholder = elements?.chat?.message_placeholder || 'Send a message';
  const canSendChatMessages =
    !!elements?.chat?.public_chat_enabled ||
    !!elements?.chat?.roles_whitelist?.length ||
    !!elements?.chat?.private_chat_enabled;

  const getChatStatus = useCallback(() => {
    if (isLocalPeerBlacklisted) return "You've been blocked from sending messages";
    if (!isChatEnabled)
      return `Chat has been paused by ${
        chatStateUpdatedBy.peerId === localPeerID ? 'you' : chatStateUpdatedBy?.userName
      }`;
    return message_placeholder;
  }, [
    chatStateUpdatedBy.peerId,
    chatStateUpdatedBy?.userName,
    isChatEnabled,
    isLocalPeerBlacklisted,
    localPeerID,
    message_placeholder,
  ]);

  return (
    <div style={{ height: '100vh' }}>
      <Box
        id="chat-container"
        css={{
          bg: '$surface_dim',
          overflowY: 'auto',
          // Subtracting height of footer
          h: canSendChatMessages ? 'calc(100% - 87px)' : '100%',
          position: 'relative',
        }}
      >
        {unreadMessageCount ? (
          <Box
            id="new-message-notif"
            style={{
              position: 'absolute',
              bottom: '76px',
              right: '4px',
              zIndex: 10,
            }}
          >
            <Text
              variant="xs"
              css={{ cursor: 'pointer' }}
              style={{ color: 'white', background: 'gray', padding: '4px', borderRadius: '4px' }}
            >
              {unreadMessageCount === 1 ? 'New message' : `${unreadMessageCount} new messages`}
            </Text>
          </Box>
        ) : (
          ''
        )}
        {filteredMessages.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              width: '100%',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text variant="h5" css={{ mt: '$8', c: '$on_surface_high' }}>
              {canSendChatMessages ? 'Start a conversation' : 'No messages yet'}
            </Text>
            {canSendChatMessages ? (
              <Text variant="sm" style={{ maxWidth: '80%', textAlign: 'center', marginTop: '4px' }}>
                There are no messages here yet. Start a conversation by sending a message.
              </Text>
            ) : (
              ''
            )}
          </div>
        ) : (
          filteredMessages.map(message => (
            <Box className="pip-message" key={message.id} id={message.id} style={{ padding: '8px 0.75rem' }}>
              <Flex style={{ width: '100%', alignItems: 'center', justifyContent: 'between' }}>
                <Text
                  style={{ display: 'flex', justifyContent: 'between', width: '100%', alignItems: 'center' }}
                  css={{
                    color: '$on_surface_high',
                    fontWeight: '$semiBold',
                  }}
                >
                  <Flex style={{ flexGrow: 1, gap: '2px', alignItems: 'center' }}>
                    {message.senderName === 'You' || !message.senderName ? (
                      <Text as="span" variant="sub2" css={{ color: '$on_surface_high', fontWeight: '$semiBold' }}>
                        {message.senderName || 'Anonymous'}
                      </Text>
                    ) : (
                      <Tooltip title={message.senderName} side="top" align="start">
                        <Text as="span" variant="sub2" css={{ color: '$on_surface_high', fontWeight: '$semiBold' }}>
                          {getSenderName(message.senderName, message?.sender)}
                        </Text>
                      </Tooltip>
                    )}
                    <MessageTitle
                      localPeerID={localPeerID}
                      recipientPeer={message.recipientPeer}
                      recipientRoles={message.recipientRoles}
                    />
                  </Flex>

                  <Text
                    variant="xs"
                    css={{
                      color: '$on_surface_medium',
                      flexShrink: 0,
                      p: '$2',
                      whitespace: 'nowrap',
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
      {canSendChatMessages && (
        <Box css={{ bg: '$surface_dim' }}>
          <Flex css={{ px: '$4', pb: '3px', gap: '$2', alignItems: 'center' }}>
            <Text variant="caption">To:</Text>
            <Flex css={{ bg: '$primary_bright', color: '$on_primary_high', r: '$2' }}>
              <select
                id="selector"
                style={{
                  background: 'inherit',
                  color: 'inherit',
                  border: 'none',
                  outline: 'none',
                  borderRadius: '4px',
                  padding: '0 2px',
                }}
                defaultValue={elements.chat?.public_chat_enabled ? 'Everyone' : elements.chat?.roles_whitelist?.[0]}
              >
                {elements.chat?.roles_whitelist?.map(role => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
                {elements.chat?.public_chat_enabled ? <option value="Everyone">Everyone</option> : ''}
              </select>
            </Flex>
          </Flex>
          <Flex
            align="center"
            css={{
              bg: '$surface_default',
              minHeight: '$16',
              width: '100%',
              py: '$6',
              pl: '$4',
              boxSizing: 'border-box',
              gap: '$2',
              r: '$2',
            }}
          >
            <TextArea
              id="chat-input"
              maxLength={CHAT_MESSAGE_LIMIT}
              disabled={!isChatEnabled || isLocalPeerBlacklisted}
              rows={1}
              css={{
                w: '100%',
                c: '$on_surface_high',
                p: '0.75rem 0.75rem !important',
                border: 'none',
                resize: 'none',
              }}
              placeholder={getChatStatus()}
              required
              autoComplete="off"
              aria-autocomplete="none"
            />

            <IconButton
              id="send-btn"
              disabled={!isChatEnabled || isLocalPeerBlacklisted}
              title={getChatStatus()}
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
      )}
    </div>
  );
};

const MessageTitle = ({
  recipientPeer,
  recipientRoles,
  localPeerID,
}: {
  recipientPeer?: string;
  recipientRoles?: string[];
  localPeerID: string;
}) => {
  const peerName = useHMSStore(selectPeerNameByID(recipientPeer));

  return (
    <>
      {recipientRoles ? (
        <Text as="span" variant="sub2" css={{ color: '$on_surface_high', fontWeight: '$semiBold' }}>
          to {recipientRoles} (Group)
        </Text>
      ) : null}
      {recipientPeer ? (
        <Text as="span" variant="sub2" css={{ color: '$on_surface_high', fontWeight: '$semiBold' }}>
          to {recipientPeer === localPeerID ? 'You' : peerName} (DM)
        </Text>
      ) : null}
    </>
  );
};
