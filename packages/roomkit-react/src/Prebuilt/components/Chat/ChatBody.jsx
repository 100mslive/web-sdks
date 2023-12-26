import React, { Fragment, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { useMedia } from 'react-use';
import AutoSizer from 'react-virtualized-auto-sizer';
import { VariableSizeList } from 'react-window';
import {
  selectHMSMessages,
  selectLocalPeerID,
  selectLocalPeerRoleName,
  selectPeerNameByID,
  selectSessionStore,
  selectUnreadHMSMessagesCount,
  useHMSActions,
  useHMSStore,
  useHMSVanillaStore,
} from '@100mslive/react-sdk';
import { Box, Flex } from '../../../Layout';
import { Text } from '../../../Text';
import { config as cssConfig, styled } from '../../../Theme';
import { Tooltip } from '../../../Tooltip';
import emptyChat from '../../images/empty-chat.svg';
import { ChatActions } from './ChatActions';
import { useRoomLayoutConferencingScreen } from '../../provider/roomLayoutProvider/hooks/useRoomLayoutScreen';
import { useSetSubscribedChatSelector } from '../AppData/useUISettings';
import { CHAT_SELECTOR, SESSION_STORE_KEY } from '../../common/constants';

const formatTime = date => {
  if (!(date instanceof Date)) {
    return '';
  }
  let hours = date.getHours();
  let mins = date.getMinutes();
  const suffix = hours > 11 ? 'PM' : 'AM';
  if (hours < 10) {
    hours = '0' + hours;
  }
  if (mins < 10) {
    mins = '0' + mins;
  }
  return `${hours}:${mins} ${suffix}`;
};

const MessageTypeContainer = ({ left, right }) => {
  return (
    <Flex
      align="center"
      css={{
        ml: '$2',
        mr: '$4',
        gap: '$space$2',
      }}
    >
      {left && (
        <SenderName
          variant="xs"
          as="span"
          css={{ color: '$on_surface_medium', textTransform: 'capitalize', fontWeight: '$regular' }}
        >
          {left}
        </SenderName>
      )}
      {right && (
        <SenderName
          as="span"
          variant="overline"
          css={{
            color: '$on_surface_medium',
            fontWeight: '$regular',
          }}
        >
          {right}
        </SenderName>
      )}
    </Flex>
  );
};

const MessageType = ({ roles, hasCurrentUserSent, receiver }) => {
  const peerName = useHMSStore(selectPeerNameByID(receiver));
  const localPeerRoleName = useHMSStore(selectLocalPeerRoleName);
  if (receiver) {
    return (
      <MessageTypeContainer left={hasCurrentUserSent ? `${peerName ? `to ${peerName}` : ''}` : 'to You'} right="(DM)" />
    );
  }

  if (roles && roles.length) {
    return <MessageTypeContainer left={`to ${hasCurrentUserSent ? roles[0] : localPeerRoleName}`} right="(Group)" />;
  }
  return null;
};

const URL_REGEX =
  /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/;

const Link = styled('a', {
  color: '$primary_default',
  wordBreak: 'break-word',
  '&:hover': {
    textDecoration: 'underline',
  },
});

export const AnnotisedMessage = ({ message }) => {
  if (!message) {
    return <Fragment />;
  }

  return (
    <Fragment>
      {message
        .trim()
        .split(/(\s)/)
        .map(part =>
          URL_REGEX.test(part) ? (
            <Link href={part} key={part} target="_blank" rel="noopener noreferrer">
              {part}
            </Link>
          ) : (
            part
          ),
        )}
    </Fragment>
  );
};

const getMessageType = ({ roles, receiver }) => {
  if (roles && roles.length > 0) {
    return 'role';
  }
  return receiver ? 'private' : '';
};
const SenderName = styled(Text, {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  maxWidth: '14ch',
  minWidth: 0,
  color: '$on_surface_high',
  fontWeight: '$semiBold',
});

const ChatMessage = React.memo(
  ({ index, style = {}, message, setRowHeight, isLast = false, scrollToBottom, onPin }) => {
    const { ref, inView } = useInView({ threshold: 0.5, triggerOnce: true });
    const { elements } = useRoomLayoutConferencingScreen();
    const vanillaStore = useHMSVanillaStore();
    const rowRef = useRef(null);
    const isMobile = useMedia(cssConfig.media.md);
    const isPrivateChatEnabled = !!elements?.chat?.private_chat_enabled;
    const roleWhiteList = elements?.chat?.roles_whitelist || [];
    const isOverlay = elements?.chat?.is_overlay && isMobile;
    const hmsActions = useHMSActions();
    const localPeerId = useHMSStore(selectLocalPeerID);
    const [selectedRole, setRoleSelector] = useSetSubscribedChatSelector(CHAT_SELECTOR.ROLE);
    const [selectedPeer, setPeerSelector] = useSetSubscribedChatSelector(CHAT_SELECTOR.PEER);
    const messageType = getMessageType({
      roles: message.recipientRoles,
      receiver: message.recipientPeer,
    });
    const [openSheet, setOpenSheet] = useState(false);
    const showPinAction = !!elements?.chat?.allow_pinning_messages;
    let showReply = false;
    if (message.recipientRoles && roleWhiteList.includes(message.recipientRoles[0])) {
      showReply = true;
    } else if (message.sender !== selectedPeer.id && message.sender !== localPeerId && isPrivateChatEnabled) {
      showReply = true;
    }

    useEffect(() => {
      if (rowRef.current) {
        setRowHeight(index, rowRef.current.clientHeight);
      }
    }, [index, setRowHeight]);

    useEffect(() => {
      if (message.id && !message.read && inView) {
        hmsActions.setMessageRead(true, message.id);
      }
    }, [message.read, hmsActions, inView, message.id]);

    useEffect(() => {
      if (isLast && inView) {
        const unreadCount = vanillaStore.getState(selectUnreadHMSMessagesCount);
        scrollToBottom(unreadCount);
      }
    }, [inView, isLast, scrollToBottom, vanillaStore]);

    return (
      <Box
        ref={ref}
        as="div"
        css={{
          mb: '$5',
          pr: '$10',
          mt: '$4',
          '&:not(:hover} .chat_actions': { display: 'none' },
          '&:hover .chat_actions': { display: 'flex', opacity: 1 },
        }}
        style={style}
      >
        <Flex
          ref={rowRef}
          align="center"
          css={{
            flexWrap: 'wrap',
            position: 'relative',
            // Theme independent color, token should not be used for transparent chat
            bg:
              messageType && !(selectedPeer.id || selectedRole)
                ? isOverlay
                  ? 'rgba(0, 0, 0, 0.64)'
                  : '$surface_default'
                : undefined,
            r: '$1',
            p: '$4',
            userSelect: 'none',
            '@md': {
              cursor: 'pointer',
            },
            '&:hover': {
              background: 'linear-gradient(277deg, $surface_default 0%, $surface_dim 60.87%)',
            },
          }}
          key={message.time}
          data-testid="chat_msg"
          onClick={() => {
            if (isMobile) {
              setOpenSheet(true);
            }
          }}
        >
          <Text
            css={{
              color: isOverlay ? '#FFF' : '$on_surface_high',
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
                <SenderName
                  as="span"
                  variant="sub2"
                  css={{ color: isOverlay ? '#FFF' : '$on_surface_high', fontWeight: '$semiBold' }}
                >
                  {message.senderName || 'Anonymous'}
                </SenderName>
              ) : (
                <Tooltip title={message.senderName} side="top" align="start">
                  <SenderName
                    as="span"
                    variant="sub2"
                    css={{ color: isOverlay ? '#FFF' : '$on_surface_high', fontWeight: '$semiBold' }}
                  >
                    {message.senderName}
                  </SenderName>
                </Tooltip>
              )}
              <MessageType
                hasCurrentUserSent={message.sender === localPeerId}
                receiver={message.recipientPeer}
                roles={message.recipientRoles}
              />
            </Flex>

            {!isOverlay ? (
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
            ) : null}
            <ChatActions
              onPin={onPin}
              showPinAction={showPinAction}
              message={message}
              sentByLocalPeer={message.sender === localPeerId}
              onReply={() => {
                if (message.recipientRoles?.length) {
                  setRoleSelector(message.recipientRoles[0]);
                  setPeerSelector({});
                } else {
                  setRoleSelector('');
                  setPeerSelector({ id: message.sender, name: message.senderName });
                }
              }}
              showReply={showReply}
              isMobile={isMobile}
              openSheet={openSheet}
              setOpenSheet={setOpenSheet}
            />
          </Text>
          <Text
            variant="sm"
            css={{
              w: '100%',
              mt: '$2',
              wordBreak: 'break-word',
              whiteSpace: 'pre-wrap',
              userSelect: 'all',
              color: isOverlay ? '#FFF' : '$on_surface_high',
            }}
            onClick={e => {
              e.stopPropagation();
              setOpenSheet(true);
            }}
          >
            <AnnotisedMessage message={message.message} />
          </Text>
        </Flex>
      </Box>
    );
  },
);
const ChatList = React.forwardRef(
  ({ width, height, setRowHeight, getRowHeight, messages, scrollToBottom }, listRef) => {
    useLayoutEffect(() => {
      if (listRef.current && listRef.current.scrollToItem) {
        scrollToBottom(1);
      }
    }, [listRef, scrollToBottom]);

    return (
      <VariableSizeList
        ref={listRef}
        itemCount={messages.length}
        itemSize={getRowHeight}
        width={width}
        height={height - 1}
        style={{
          overflowX: 'hidden',
        }}
      >
        {({ index, style }) => (
          <ChatMessage
            style={style}
            index={index}
            key={messages[index].id}
            message={messages[index]}
            setRowHeight={setRowHeight}
            isLast={index >= messages.length - 2}
            scrollToBottom={scrollToBottom}
          />
        )}
      </VariableSizeList>
    );
  },
);
const VirtualizedChatMessages = React.forwardRef(({ messages, scrollToBottom }, listRef) => {
  const rowHeights = useRef({});

  function getRowHeight(index) {
    // 72 will be default row height for any message length
    // 16 will add margin value as clientHeight don't include margin
    return rowHeights.current[index] + 16 || 72;
  }

  const setRowHeight = useCallback(
    (index, size) => {
      listRef.current.resetAfterIndex(0);
      rowHeights.current = { ...rowHeights.current, [index]: size };
    },
    [listRef],
  );

  return (
    <Box
      css={{
        mr: '-$10',
        h: '100%',
      }}
      as="div"
    >
      <AutoSizer
        style={{
          width: '90%',
        }}
      >
        {({ height, width }) => (
          <ChatList
            width={width}
            height={height}
            messages={messages}
            setRowHeight={setRowHeight}
            getRowHeight={getRowHeight}
            scrollToBottom={scrollToBottom}
            ref={listRef}
          />
        )}
      </AutoSizer>
    </Box>
  );
});

export const ChatBody = React.forwardRef(({ scrollToBottom }, listRef) => {
  let messages = useHMSStore(selectHMSMessages);
  const blacklistedMessageIDs = useHMSStore(selectSessionStore(SESSION_STORE_KEY.CHAT_MESSAGE_BLACKLIST));
  const filteredMessages = useMemo(() => {
    const blacklistedMessageIDSet = new Set(blacklistedMessageIDs || []);
    return messages?.filter(message => message.type === 'chat' && !blacklistedMessageIDSet.has(message.id)) || [];
  }, [blacklistedMessageIDs, messages]);

  const isMobile = useMedia(cssConfig.media.md);
  const { elements } = useRoomLayoutConferencingScreen();

  if (messages.length === 0 && !(isMobile && elements?.chat?.is_overlay)) {
    return (
      <Flex
        css={{
          width: '100%',
          flex: '1 1 0',
          textAlign: 'center',
          px: '$4',
        }}
        align="center"
        justify="center"
      >
        <Box>
          <img src={emptyChat} alt="Empty Chat" height={132} width={185} style={{ margin: '0 auto' }} />
          <Text variant="h5" css={{ mt: '$8', c: '$on_surface_high' }}>
            Start a conversation
          </Text>
          <Text
            variant="sm"
            css={{ mt: '$4', maxWidth: '80%', textAlign: 'center', mx: 'auto', c: '$on_surface_medium' }}
          >
            There are no messages here yet. Start a conversation by sending a message.
          </Text>
        </Box>
      </Flex>
    );
  }

  return (
    <Fragment>
      <VirtualizedChatMessages messages={filteredMessages} scrollToBottom={scrollToBottom} ref={listRef} />
    </Fragment>
  );
});
