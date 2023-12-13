import React, { Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { useMedia } from 'react-use';
import AutoSizer from 'react-virtualized-auto-sizer';
import { VariableSizeList } from 'react-window';
import {
  selectHMSMessages,
  selectLocalPeerID,
  selectLocalPeerName,
  selectLocalPeerRoleName,
  selectPeerNameByID,
  selectPermissions,
  selectSessionStore,
  selectUnreadHMSMessagesCount,
  useHMSActions,
  useHMSStore,
} from '@100mslive/react-sdk';
import {
  CopyIcon,
  CrossCircleIcon,
  CrossIcon,
  EyeCloseIcon,
  PeopleRemoveIcon,
  PinIcon,
  ReplyIcon,
  VerticalMenuIcon,
} from '@100mslive/react-icons';
import { Dropdown } from '../../../Dropdown';
import { IconButton } from '../../../IconButton';
import { Box, Flex } from '../../../Layout';
import { Sheet } from '../../../Sheet';
import { Text } from '../../../Text';
import { config as cssConfig, styled } from '../../../Theme';
import { Tooltip } from '../../../Tooltip';
import emptyChat from '../../images/empty-chat.svg';
import { ToastManager } from '../Toast/ToastManager';
import { MwebChatOption } from './MwebChatOption';
import { useRoomLayoutConferencingScreen } from '../../provider/roomLayoutProvider/hooks/useRoomLayoutScreen';
import { useSetSubscribedChatSelector } from '../AppData/useUISettings';
import { useChatBlacklist } from '../hooks/useChatBlacklist';
import { useSetPinnedMessages } from '../hooks/useSetPinnedMessages';
import { CHAT_SELECTOR, SESSION_STORE_KEY } from '../../common/constants';

const iconStyle = { height: '1.125rem', width: '1.125rem' };
const tooltipBoxCSS = {
  fontSize: '$xs',
  backgroundColor: '$surface_default',
  p: '$1 $5',
  fontWeight: '$regular',
  borderRadius: '$3',
};

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
        ml: 'auto',
        mr: '$4',
        gap: '$space$2',
      }}
    >
      {left && (
        <SenderName
          variant="xs"
          as="span"
          css={{ color: '$on_surface_medium', pl: '$1', textTransform: 'capitalize', fontWeight: '$regular' }}
        >
          {left}
        </SenderName>
      )}
      {right && (
        <SenderName
          as="span"
          variant="overline"
          css={{ textTransform: 'uppercase', background: '$primary_dim', p: '$1 $2', r: '$1', fontWeight: '$semiBold' }}
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
      <MessageTypeContainer left={hasCurrentUserSent ? `${peerName ? `to ${peerName}` : ''}` : 'to You'} right="DM" />
    );
  }

  if (roles && roles.length) {
    return <MessageTypeContainer left={`to ${hasCurrentUserSent ? roles[0] : localPeerRoleName}`} right="ROLE" />;
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
const ChatActions = ({
  onPin,
  showPinAction,
  onReply,
  showReply,
  message,
  sentByLocalPeer,
  isMobile,
  openSheet,
  setOpenSheet,
}) => {
  const { elements } = useRoomLayoutConferencingScreen();
  const { can_hide_message, can_block_user } = elements?.chat?.real_time_controls || {
    can_hide_message: false,
    can_block_user: false,
  };
  const [open, setOpen] = useState(false);
  const actions = useHMSActions();
  const canRemoveOthers = useHMSStore(selectPermissions)?.removeOthers;
  const { blacklistItem: blacklistPeer } = useChatBlacklist(SESSION_STORE_KEY.CHAT_PEER_BLACKLIST);

  const { blacklistItem: blacklistMessage, blacklistedIDs: blacklistedMessageIDs = [] } = useChatBlacklist(
    SESSION_STORE_KEY.CHAT_MESSAGE_BLACKLIST,
  );
  const { unpinBlacklistedMessages } = useSetPinnedMessages();

  const pinnedMessages = useHMSStore(selectSessionStore(SESSION_STORE_KEY.PINNED_MESSAGES));
  const updatePinnedMessages = useCallback(
    (messageID = '') => {
      const blacklistedMessageIDSet = new Set([...blacklistedMessageIDs, messageID]);
      unpinBlacklistedMessages(pinnedMessages, blacklistedMessageIDSet);
    },
    [blacklistedMessageIDs, unpinBlacklistedMessages, pinnedMessages],
  );

  const copyMessageContent = useCallback(() => {
    try {
      navigator?.clipboard.writeText(message.message);
      ToastManager.addToast({
        title: 'Message copied successfully',
      });
    } catch (e) {
      console.log(e);
      ToastManager.addToast({
        title: 'Could not copy message',
      });
    }
  }, [message]);

  const options = {
    reply: {
      text: message.recipientRoles?.length ? 'Reply to Group' : 'Reply Privately',
      tooltipText: message.recipientRoles?.length ? 'Reply to Group' : 'Reply Privately',
      icon: <ReplyIcon style={iconStyle} />,
      onClick: onReply,
      show: showReply,
    },
    pin: {
      text: 'Pin message',
      tooltipText: 'Pin',
      icon: <PinIcon style={iconStyle} />,
      onClick: onPin,
      show: showPinAction,
    },
    copy: {
      text: 'Copy text',
      tooltipText: 'Copy',
      icon: <CopyIcon style={iconStyle} />,
      onClick: copyMessageContent,
      show: true,
    },
    hide: {
      text: 'Hide for everyone',
      icon: <EyeCloseIcon style={iconStyle} />,
      onClick: async () => {
        blacklistMessage(message.id);
        updatePinnedMessages(message.id);
      },
      show: can_hide_message,
    },
    block: {
      text: 'Block from chat',
      icon: <CrossCircleIcon style={iconStyle} />,
      onClick: async () => blacklistPeer(message?.senderUserId),
      color: '$alert_error_default',
      show: can_block_user && !sentByLocalPeer,
    },
    remove: {
      text: 'Remove Partipant',
      icon: <PeopleRemoveIcon style={iconStyle} />,
      color: '$alert_error_default',
      show: canRemoveOthers && !sentByLocalPeer,
      onClick: async () => {
        try {
          await actions.removePeer(message.sender, '');
        } catch (error) {
          ToastManager.addToast({ title: error.message, variant: 'error' });
        }
      },
    },
  };

  if (isMobile) {
    return (
      <Sheet.Root open={openSheet} onOpenChange={setOpenSheet}>
        <Sheet.Content css={{ bg: '$surface_default', pb: '$14' }} onClick={() => setOpenSheet(false)}>
          <Sheet.Title
            css={{
              display: 'flex',
              color: '$on_surface_high',
              w: '100%',
              justifyContent: 'space-between',
              mt: '$8',
              fontSize: '$md',
              px: '$10',
              pb: '$8',
              borderBottom: '1px solid $border_bright',
              alignItems: 'center',
            }}
          >
            Message options
            <Sheet.Close css={{ color: '$on_surface_high' }} onClick={() => setOpenSheet(false)}>
              <CrossIcon />
            </Sheet.Close>
          </Sheet.Title>

          {Object.keys(options).map(optionKey => {
            const option = options[optionKey];
            return option.show ? (
              <MwebChatOption
                key={optionKey}
                text={option.text}
                icon={option.icon}
                onClick={option.onClick}
                color={option?.color}
              />
            ) : null;
          })}
        </Sheet.Content>
      </Sheet.Root>
    );
  }

  return (
    <Dropdown.Root open={open} onOpenChange={setOpen} css={{ '@md': { display: 'none' } }}>
      <Flex
        className="chat_actions"
        css={{
          background: '$surface_bright',
          borderRadius: '$1',
          p: '$2',
          opacity: open ? 1 : 0,
          position: 'absolute',
          right: 0,
          zIndex: 1,
          '@md': { opacity: 1 },
        }}
      >
        {options.reply.show ? (
          <Tooltip boxCss={tooltipBoxCSS} title={options.reply.tooltipText}>
            <IconButton data-testid="reply_message_btn" onClick={options.reply.onClick}>
              {options.reply.icon}
            </IconButton>
          </Tooltip>
        ) : null}
        {options.pin.show ? (
          <Tooltip boxCss={tooltipBoxCSS} title={options.pin.tooltipText}>
            <IconButton data-testid="pin_message_btn" onClick={options.pin.onClick}>
              {options.pin.icon}
            </IconButton>
          </Tooltip>
        ) : null}

        {options.copy.show ? (
          <Tooltip boxCss={tooltipBoxCSS} title={options.copy.tooltipText}>
            <IconButton onClick={options.copy.onClick} data-testid="copy_message_btn">
              <CopyIcon style={iconStyle} />
            </IconButton>
          </Tooltip>
        ) : null}

        {options.block.show || options.hide.show || options.remove.show ? (
          <Tooltip boxCss={tooltipBoxCSS} title="More actions">
            <Dropdown.Trigger asChild>
              <IconButton>
                <VerticalMenuIcon style={iconStyle} />
              </IconButton>
            </Dropdown.Trigger>
          </Tooltip>
        ) : null}
      </Flex>
      <Dropdown.Portal>
        <Dropdown.Content
          sideOffset={5}
          align="end"
          css={{ width: '$48', backgroundColor: '$surface_bright', py: '$0', border: '1px solid $border_bright' }}
        >
          {options.hide.show ? (
            <Dropdown.Item data-testid="hide_message_btn" onClick={options.hide.onClick}>
              {options.hide.icon}
              <Text variant="sm" css={{ ml: '$4', fontWeight: '$semiBold' }}>
                {options.hide.text}
              </Text>
            </Dropdown.Item>
          ) : null}

          {options.block.show ? (
            <Dropdown.Item
              data-testid="block_peer_btn"
              onClick={options.block.onClick}
              css={{ color: options.block.color }}
            >
              {options.block.icon}
              <Text variant="sm" css={{ ml: '$4', color: 'inherit', fontWeight: '$semiBold' }}>
                {options.block.text}
              </Text>
            </Dropdown.Item>
          ) : null}
          {options.remove.show ? (
            <Dropdown.Item
              data-testid="remove_peer_btn"
              onClick={options.remove.onClick}
              css={{ color: options.remove.color }}
            >
              {options.remove.icon}
              <Text variant="sm" css={{ ml: '$4', color: 'inherit', fontWeight: '$semiBold' }}>
                {options.remove.text}
              </Text>
            </Dropdown.Item>
          ) : null}
        </Dropdown.Content>
      </Dropdown.Portal>
    </Dropdown.Root>
  );
};

const SenderName = styled(Text, {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  maxWidth: '16ch',
  minWidth: 0,
  color: '$on_surface_high',
  fontWeight: '$semiBold',
});

const ChatMessage = React.memo(
  ({ index, style = {}, message, setRowHeight, isLast = false, unreadCount = 0, scrollToBottom, onPin }) => {
    const { ref, inView } = useInView({ threshold: 0.5, triggerOnce: true });
    const { elements } = useRoomLayoutConferencingScreen();
    const rowRef = useRef(null);
    useEffect(() => {
      if (rowRef.current) {
        setRowHeight(index, rowRef.current.clientHeight);
      }
    }, [index, setRowHeight]);
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
      if (message.id && !message.read && inView) {
        hmsActions.setMessageRead(true, message.id);
      }
    }, [message.read, hmsActions, inView, message.id]);

    useEffect(() => {
      if (isLast && inView && unreadCount >= 1) {
        scrollToBottom(1);
      }
    }, [inView, isLast, scrollToBottom, unreadCount]);

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
  ({ width, height, setRowHeight, getRowHeight, messages, unreadCount = 0, scrollToBottom }, listRef) => {
    const { setPinnedMessages } = useSetPinnedMessages();
    const pinnedMessages = useHMSStore(selectSessionStore(SESSION_STORE_KEY.PINNED_MESSAGES)) || [];
    const localPeerName = useHMSStore(selectLocalPeerName);
    useLayoutEffect(() => {
      if (listRef.current && listRef.current.scrollToItem) {
        scrollToBottom(1);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [listRef]);

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
            unreadCount={unreadCount}
            isLast={index >= messages.length - 2}
            scrollToBottom={scrollToBottom}
            onPin={() => setPinnedMessages(pinnedMessages, messages[index], localPeerName)}
          />
        )}
      </VariableSizeList>
    );
  },
);
const VirtualizedChatMessages = React.forwardRef(({ messages, unreadCount = 0, scrollToBottom }, listRef) => {
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
            unreadCount={unreadCount}
          />
        )}
      </AutoSizer>
    </Box>
  );
});

export const ChatBody = React.forwardRef(({ scrollToBottom }, listRef) => {
  let messages = useHMSStore(selectHMSMessages);
  const blacklistedMessageIDs = useHMSStore(selectSessionStore(SESSION_STORE_KEY.CHAT_MESSAGE_BLACKLIST)) || [];
  const getFilteredMessages = () => {
    const blacklistedMessageIDSet = new Set(blacklistedMessageIDs);
    return messages?.filter(message => message.type === 'chat' && !blacklistedMessageIDSet.has(message.id)) || [];
  };

  const isMobile = useMedia(cssConfig.media.md);
  const { elements } = useRoomLayoutConferencingScreen();
  const unreadCount = useHMSStore(selectUnreadHMSMessagesCount);

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
      <VirtualizedChatMessages
        messages={getFilteredMessages()}
        scrollToBottom={scrollToBottom}
        unreadCount={unreadCount}
        ref={listRef}
      />
    </Fragment>
  );
});
