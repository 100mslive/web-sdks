import React, { Fragment, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useMedia } from 'react-use';
import AutoSizer from 'react-virtualized-auto-sizer';
import { VariableSizeList } from 'react-window';
import {
  HMSMessage,
  HMSPeerID,
  HMSRoleName,
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
// @ts-ignore
import emptyChat from '../../images/empty-chat.svg';
import { ChatActions } from './ChatActions';
import { useRoomLayoutConferencingScreen } from '../../provider/roomLayoutProvider/hooks/useRoomLayoutScreen';
// @ts-ignore: No implicit Any
import { useSetSubscribedChatSelector } from '../AppData/useUISettings';
import { CHAT_SELECTOR, SESSION_STORE_KEY } from '../../common/constants';

const formatTime = (date: Date) => {
  if (!(date instanceof Date)) {
    return '';
  }
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const suffix = hours > 11 ? 'PM' : 'AM';
  return `${hours < 10 ? '0' : ''}${hours}:${minutes < 10 ? '0' : ''}${minutes} ${suffix}`;
};

const rowHeights: Record<number, { size: number; id: string }> = {};
let listInstance: VariableSizeList | null = null; //eslint-disable-line
function getRowHeight(index: number) {
  // 72 will be default row height for any message length
  return rowHeights[index]?.size || 72;
}

const setRowHeight = (index: number, id: string, size: number) => {
  if (rowHeights[index]?.id === id && rowHeights[index]?.size) {
    return;
  }
  listInstance?.resetAfterIndex(Math.max(index - 1, 0));
  Object.assign(rowHeights, { [index]: { size, id } });
};

const MessageTypeContainer = ({ left, right }: { left?: string; right?: string }) => {
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

const MessageType = ({
  roles,
  hasCurrentUserSent,
  receiver,
}: {
  roles?: HMSRoleName[];
  hasCurrentUserSent: boolean;
  receiver?: HMSPeerID;
}) => {
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

export const AnnotisedMessage = ({ message }: { message: string }) => {
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

const getMessageType = ({ roles, receiver }: { roles?: HMSRoleName[]; receiver?: HMSPeerID }) => {
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
  ({ index, style = {}, message }: { message: HMSMessage; index: number; style: React.CSSProperties }) => {
    const { elements } = useRoomLayoutConferencingScreen();
    const rowRef = useRef<HTMLDivElement | null>(null);
    const isMobile = useMedia(cssConfig.media.md);
    const isPrivateChatEnabled = !!elements?.chat?.private_chat_enabled;
    const roleWhiteList = elements?.chat?.roles_whitelist || [];
    const isOverlay = elements?.chat?.is_overlay && isMobile;
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

    useLayoutEffect(() => {
      if (rowRef.current) {
        setRowHeight(index, message.id, rowRef.current.clientHeight);
      }
    }, [index, message.id]);

    return (
      <Box
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

const MessageWrapper = React.memo(
  ({ index, style, data }: { index: number; style: React.CSSProperties; data: HMSMessage[] }) => {
    return <ChatMessage style={style} index={index} key={data[index].id} message={data[index]} />;
  },
);

const VirtualizedChatMessages = React.forwardRef<
  VariableSizeList,
  { messages: HMSMessage[]; scrollToBottom: (count: number) => void }
>(({ messages, scrollToBottom }, listRef) => {
  const hmsActions = useHMSActions();
  const itemKey = useCallback((index: number, data: HMSMessage[]) => {
    return data[index].id;
  }, []);
  useEffect(() => {
    requestAnimationFrame(() => scrollToBottom(1));
  }, [scrollToBottom]);
  return (
    <Box
      css={{
        mr: '-$10',
        h: '100%',
      }}
    >
      <AutoSizer
        style={{
          width: '90%',
        }}
      >
        {({ height, width }: { height: number; width: number }) => (
          <VariableSizeList
            ref={node => {
              if (node) {
                // @ts-ignore
                listRef.current = node;
                listInstance = node;
              }
            }}
            itemCount={messages.length}
            itemSize={getRowHeight}
            itemData={messages}
            width={width}
            height={height}
            style={{
              overflowX: 'hidden',
            }}
            itemKey={itemKey}
            onItemsRendered={({ visibleStartIndex, visibleStopIndex }) => {
              for (let i = visibleStartIndex; i <= visibleStopIndex; i++) {
                if (!messages[i].read) {
                  hmsActions.setMessageRead(true, messages[i].id);
                }
              }
            }}
          >
            {MessageWrapper}
          </VariableSizeList>
        )}
      </AutoSizer>
    </Box>
  );
});

export const ChatBody = React.forwardRef<VariableSizeList, { scrollToBottom: (count: number) => void }>(
  ({ scrollToBottom }: { scrollToBottom: (count: number) => void }, listRef) => {
    const messages = useHMSStore(selectHMSMessages);
    const blacklistedMessageIDs = useHMSStore(selectSessionStore(SESSION_STORE_KEY.CHAT_MESSAGE_BLACKLIST));
    const filteredMessages = useMemo(() => {
      const blacklistedMessageIDSet = new Set(blacklistedMessageIDs || []);
      return messages?.filter(message => message.type === 'chat' && !blacklistedMessageIDSet.has(message.id)) || [];
    }, [blacklistedMessageIDs, messages]);

    const isMobile = useMedia(cssConfig.media.md);
    const { elements } = useRoomLayoutConferencingScreen();
    const vanillaStore = useHMSVanillaStore();
    const canSendMessages = !!elements.chat?.public_chat_enabled;

    useEffect(() => {
      const unsubscribe = vanillaStore.subscribe(() => {
        // @ts-ignore
        if (!listRef.current) {
          return;
        }
        // @ts-ignore
        const outerElement = listRef.current._outerRef;
        if (outerElement.clientHeight + outerElement.scrollTop + outerElement.offsetTop >= outerElement.scrollHeight) {
          requestAnimationFrame(() => scrollToBottom(1));
        }
      }, selectUnreadHMSMessagesCount);
      return unsubscribe;
    }, [vanillaStore, listRef, scrollToBottom]);

    if (filteredMessages.length === 0 && !(isMobile && elements?.chat?.is_overlay)) {
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
              {canSendMessages ? 'Start a conversation' : 'No messages yet'}
            </Text>
            {canSendMessages ? (
              <Text
                variant="sm"
                css={{ mt: '$4', maxWidth: '80%', textAlign: 'center', mx: 'auto', c: '$on_surface_medium' }}
              >
                There are no messages here yet. Start a conversation by sending a message.
              </Text>
            ) : null}
          </Box>
        </Flex>
      );
    }

    return <VirtualizedChatMessages messages={filteredMessages} ref={listRef} scrollToBottom={scrollToBottom} />;
  },
);
