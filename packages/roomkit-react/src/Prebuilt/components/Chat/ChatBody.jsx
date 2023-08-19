import React, { Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { useMedia } from 'react-use';
import AutoSizer from 'react-virtualized-auto-sizer';
import { VariableSizeList } from 'react-window';
import {
  selectHMSMessages,
  selectLocalPeerID,
  selectLocalPeerRoleName,
  selectMessagesByPeerID,
  selectMessagesByRole,
  selectPeerNameByID,
  selectPermissions,
  useHMSActions,
  useHMSStore,
} from '@100mslive/react-sdk';
import { CopyIcon, PinIcon, VerticalMenuIcon } from '@100mslive/react-icons';
import { Dropdown } from '../../../Dropdown';
import { IconButton } from '../../../IconButton';
import { Box, Flex } from '../../../Layout';
import { Text } from '../../../Text';
import { config as cssConfig, styled } from '../../../Theme';
import { Tooltip } from '../../../Tooltip';
import emptyChat from '../../images/empty-chat.svg';
import { ToastManager } from '../Toast/ToastManager';
import { useHLSViewerRole } from '../AppData/useUISettings';
import { useSetPinnedMessage } from '../hooks/useSetPinnedMessage';
import { useShowStreamingUI } from '../../common/hooks';

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
        p: '$2 $4',
        border: '1px solid $border_bright',
        r: '$0',
      }}
    >
      {left && (
        <SenderName variant="tiny" as="span" css={{ color: '$on_surface_medium' }}>
          {left}
        </SenderName>
      )}
      {left && right && <Box css={{ borderLeft: '1px solid $border_bright', mx: '$4', h: '$8' }} />}
      {right && (
        <SenderName as="span" variant="tiny" css={{ textTransform: 'uppercase' }}>
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
      <MessageTypeContainer
        left={hasCurrentUserSent ? `${peerName ? `TO ${peerName}` : ''}` : 'TO YOU'}
        right="PRIVATE"
      />
    );
  }

  if (roles && roles.length) {
    return <MessageTypeContainer left="TO" right={hasCurrentUserSent ? roles.join(',') : localPeerRoleName} />;
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
const ChatActions = ({ onPin, showPinAction, messageContent }) => {
  const [open, setOpen] = useState(false);
  const isMobile = useMedia(cssConfig.media.md);
  if (!isMobile && !showPinAction) {
    return null;
  }

  return (
    <Dropdown.Root open={open} onOpenChange={setOpen}>
      <Dropdown.Trigger asChild>
        <IconButton>
          <Tooltip title="More options">
            <VerticalMenuIcon />
          </Tooltip>
        </IconButton>
      </Dropdown.Trigger>
      <Dropdown.Portal>
        <Dropdown.Content
          sideOffset={5}
          align="end"
          css={{ width: '$48', backgroundColor: '$surface_bright', py: '$0', border: '1px solid $border_bright' }}
        >
          <Dropdown.Item data-testid="pin_message_btn" onClick={onPin}>
            <PinIcon />
            <Text variant="sm" css={{ ml: '$4' }}>
              Pin Message
            </Text>
          </Dropdown.Item>
          {isMobile && showPinAction ? <Dropdown.ItemSeparator css={{ my: 0 }} /> : null}
          {isMobile ? (
            <Dropdown.Item
              data-testid="copy_message_btn"
              onClick={() => {
                try {
                  navigator?.clipboard.writeText(messageContent);
                  ToastManager.addToast({
                    title: 'Message copied successfully',
                  });
                } catch (e) {
                  console.log(e);
                  ToastManager.addToast({
                    title: 'Could not copy message',
                  });
                }
              }}
            >
              <CopyIcon />
              <Text variant="sm" css={{ ml: '$4' }}>
                Copy Message
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
  maxWidth: '24ch',
  minWidth: 0,
  color: '$on_surface_high',
  fontWeight: '$semiBold',
});

const ChatMessage = React.memo(({ index, style = {}, message, setRowHeight, onPin }) => {
  const { ref, inView } = useInView({ threshold: 0.5, triggerOnce: true });
  const rowRef = useRef(null);
  useEffect(() => {
    if (rowRef.current) {
      setRowHeight(index, rowRef.current.clientHeight);
    }
  }, [index, setRowHeight]);
  const isMobile = useMedia(cssConfig.media.md);
  const localPeerRole = useHMSStore(selectLocalPeerRoleName);
  const hlsViewerRole = useHLSViewerRole();
  const isHLSViewer = localPeerRole === hlsViewerRole;
  const showStreamingUI = useShowStreamingUI();
  const mwebStreaming = isMobile && (showStreamingUI || isHLSViewer);

  const hmsActions = useHMSActions();
  const localPeerId = useHMSStore(selectLocalPeerID);
  const permissions = useHMSStore(selectPermissions);
  const messageType = getMessageType({
    roles: message.recipientRoles,
    receiver: message.recipientPeer,
  });
  // show pin action only if peer has remove others permission and the message is of broadcast type
  const showPinAction = permissions.removeOthers && !messageType;

  useEffect(() => {
    if (message.id && !message.read && inView) {
      hmsActions.setMessageRead(true, message.id);
    }
  }, [message.read, hmsActions, inView, message.id]);

  return (
    <Box ref={ref} as="div" css={{ mb: '$10', pr: '$10' }} style={style}>
      <Flex
        ref={rowRef}
        align="center"
        css={{
          flexWrap: 'wrap',
          // Theme independent color, token should not be used for transparent chat
          bg: messageType ? (mwebStreaming ? 'rgba(0, 0, 0, 0.64)' : '$surface_default') : undefined,
          r: messageType ? '$1' : undefined,
          px: messageType ? '$4' : '$2',
          py: messageType ? '$4' : 0,
          userSelect: 'none',
        }}
        key={message.time}
        data-testid="chat_msg"
      >
        <Text
          css={{
            color: '$on_surface_high',
            fontWeight: '$semiBold',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
          }}
          as="div"
        >
          <Flex align="center">
            {message.senderName === 'You' || !message.senderName ? (
              <SenderName as="span" variant="sm">
                {message.senderName || 'Anonymous'}
              </SenderName>
            ) : (
              <Tooltip title={message.senderName} side="top" align="start">
                <SenderName as="span" variant="sm">
                  {message.senderName}
                </SenderName>
              </Tooltip>
            )}
            {!mwebStreaming ? (
              <Text
                as="span"
                variant="xs"
                css={{
                  ml: '$4',
                  color: '$on_primary_medium',
                  flexShrink: 0,
                }}
              >
                {formatTime(message.time)}
              </Text>
            ) : null}
          </Flex>
          <MessageType
            hasCurrentUserSent={message.sender === localPeerId}
            receiver={message.recipientPeer}
            roles={message.recipientRoles}
          />
          {!mwebStreaming ? (
            <ChatActions onPin={onPin} showPinAction={showPinAction} messageContent={message.message} />
          ) : null}
        </Text>
        <Text
          variant="body2"
          css={{
            w: '100%',
            mt: '$2',
            wordBreak: 'break-word',
            whiteSpace: 'pre-wrap',
            userSelect: 'all',
          }}
          onClick={e => e.stopPropagation()}
        >
          <AnnotisedMessage message={message.message} />
        </Text>
      </Flex>
    </Box>
  );
});
const ChatList = React.forwardRef(
  ({ width, height, setRowHeight, getRowHeight, messages, scrollToBottom }, listRef) => {
    const { setPinnedMessage } = useSetPinnedMessage();
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
            onPin={() => setPinnedMessage(messages[index])}
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

export const ChatBody = React.forwardRef(({ role, peerId, scrollToBottom, mwebStreaming }, listRef) => {
  const storeMessageSelector = role
    ? selectMessagesByRole(role)
    : peerId
    ? selectMessagesByPeerID(peerId)
    : selectHMSMessages;
  const messages = useHMSStore(storeMessageSelector) || [];

  if (messages.length === 0 && !mwebStreaming) {
    return (
      <Flex
        css={{
          width: '100%',
          height: '100%',
          textAlign: 'center',
          px: '$4',
        }}
        align="center"
        justify="center"
      >
        <Box>
          <img src={emptyChat} alt="Empty Chat" height={132} width={185} />
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
      <VirtualizedChatMessages messages={messages} scrollToBottom={scrollToBottom} ref={listRef} />
    </Fragment>
  );
});
