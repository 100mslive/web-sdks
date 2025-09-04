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
  selectLocalPeerName,
  selectLocalPeerRoleName,
  selectPeerNameByID,
  selectSessionStore,
  selectUnreadHMSMessagesCount,
  useHMSActions,
  useHMSStore,
  useHMSVanillaStore,
} from '@100mslive/react-sdk';
import { SolidPinIcon } from '@100mslive/react-icons';
import { Box, Flex } from '../../../Layout';
import { Text } from '../../../Text';
import { config as cssConfig, styled } from '../../../Theme';
import { Tooltip } from '../../../Tooltip';
import { ChatActions } from './ChatActions';
import { EmptyChat } from './EmptyChat';
import { useRoomLayoutConferencingScreen } from '../../provider/roomLayoutProvider/hooks/useRoomLayoutScreen';
// @ts-ignore: No implicit Any
import { useSetSubscribedChatSelector } from '../AppData/useUISettings';
import { usePinnedBy } from '../hooks/usePinnedBy';
import { formatTime } from './utils';
import { CHAT_SELECTOR, SESSION_STORE_KEY } from '../../common/constants';

const rowHeights: Record<number, { size: number; id: string }> = {};
let listInstance: VariableSizeList | null = null; //eslint-disable-line
function getRowHeight(index: number) {
  // 72 will be default row height for any message length
  return rowHeights[index]?.size || 72;
}

const setRowHeight = (index: number, id: string, size: number) => {
  if (rowHeights[index]?.id === id && rowHeights[index]?.size === size) {
    return;
  }
  listInstance?.resetAfterIndex(Math.max(index - 1, 0));
  Object.assign(rowHeights, { [index]: { size, id } });
};

const getMessageBackgroundColor = (
  messageType: string,
  selectedPeerID: string,
  selectedRole: string,
  isOverlay: boolean,
) => {
  if (messageType && !(selectedPeerID || selectedRole)) {
    return isOverlay ? 'rgba(0, 0, 0, 0.64)' : '$surface_default';
  }
  return '';
};

const MessageTypeContainer = ({ left, right }: { left?: string; right?: string }) => {
  return (
    <Flex
      align="center"
      css={{
        ml: '$2',
        mr: '$4',
        gap: '$space$2',
        flexWrap: 'nowrap',
      }}
    >
      {left && (
        <Text
          variant="xs"
          as="span"
          css={{
            color: '$on_surface_medium',
            textTransform: 'capitalize',
            fontWeight: '$regular',
            whiteSpace: 'nowrap',
          }}
        >
          {left}
        </Text>
      )}
      {right && (
        <Text
          as="span"
          variant="overline"
          css={{
            color: '$on_surface_medium',
            fontWeight: '$regular',
            whiteSpace: 'nowrap',
          }}
        >
          {right}
        </Text>
      )}
    </Flex>
  );
};

export const MessageType = ({
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

export const AnnotisedMessage = ({ message, length }: { message: string; length?: number }) => {
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
              {part.slice(0, length)}
            </Link>
          ) : (
            part.slice(0, length)
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

export const SenderName = styled(Text, {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  width: '100%',
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
    const isOverlay = elements?.chat?.is_overlay && isMobile;
    const localPeerId = useHMSStore(selectLocalPeerID);
    const [selectedRole, setRoleSelector] = useSetSubscribedChatSelector(CHAT_SELECTOR.ROLE);
    const [selectedPeer, setPeerSelector] = useSetSubscribedChatSelector(CHAT_SELECTOR.PEER);
    const messageType = getMessageType({
      roles: message.recipientRoles,
      receiver: message.recipientPeer,
    });
    const [openSheet, setOpenSheetBare] = useState(false);
    const showPinAction = !!elements?.chat?.allow_pinning_messages;
    const showReply = message.sender !== selectedPeer.id && message.sender !== localPeerId && isPrivateChatEnabled;
    useLayoutEffect(() => {
      if (rowRef.current) {
        setRowHeight(index, message.id, rowRef.current.clientHeight);
      }
    }, [index, message.id]);

    const setOpenSheet = (value: boolean, e?: React.MouseEvent<HTMLElement, MouseEvent>) => {
      e?.stopPropagation();
      setOpenSheetBare(value);
    };

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
            background: getMessageBackgroundColor(messageType, selectedPeer.id, selectedRole, !!isOverlay),
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
          onClick={(e: React.MouseEvent) => {
            if (isMobile) {
              setOpenSheet(true, e);
            }
          }}
        >
          <PinnedBy messageId={message.id} index={index} rowRef={rowRef} />
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
            <Flex
              align="baseline"
              css={{
                flexWrap: 'nowrap',
                maxWidth: 'calc(100% - 10ch)',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {message.senderName === 'You' || !message.senderName ? (
                <SenderName
                  as="span"
                  variant="sub2"
                  css={{ color: isOverlay ? '#FFF' : '$on_surface_high', fontWeight: '$semiBold' }}
                >
                  {message.senderName || 'Anonymous'}
                </SenderName>
              ) : (
                <Tooltip title={message.senderName} side="top" align="start" boxStyle={{ zIndex: 50 }}>
                  <SenderName
                    as="span"
                    variant="sub2"
                    css={{ color: isOverlay ? '#FFF' : '$on_surface_high', fontWeight: '$semiBold' }}
                  >
                    {message.sender === localPeerId ? `${message.senderName} (You)` : message.senderName}
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
                setRoleSelector('');
                setPeerSelector({ id: message.sender, name: message.senderName });
              }}
              onReplyGroup={() => {
                if (message.senderRole) {
                  setRoleSelector(message.senderRole);
                  setPeerSelector({});
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
            onClick={(e: React.MouseEvent) => {
              setOpenSheet(true, e);
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
          // @ts-expect-error - React 19 type incompatibility with react-window
          <VariableSizeList
            // @ts-ignore - React 19 type incompatibility with react-window
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

    const vanillaStore = useHMSVanillaStore();
    const rerenderOnFirstMount = useRef(false);

    useEffect(() => {
      const unsubscribe = vanillaStore.subscribe(() => {
        // @ts-ignore
        if (!listRef.current) {
          return;
        }
        // @ts-ignore
        const outerElement = listRef.current._outerRef;
        if (
          outerElement &&
          outerElement.clientHeight + outerElement.scrollTop + outerElement.offsetTop >= outerElement.scrollHeight
        ) {
          requestAnimationFrame(() => scrollToBottom(1));
        }
      }, selectUnreadHMSMessagesCount);
      return unsubscribe;
    }, [vanillaStore, listRef, scrollToBottom]);

    useEffect(() => {
      // @ts-ignore
      if (filteredMessages.length > 0 && listRef?.current && !rerenderOnFirstMount.current) {
        rerenderOnFirstMount.current = true;
        // @ts-ignore
        listRef.current.resetAfterIndex(0);
      }
    }, [listRef, filteredMessages]);

    return filteredMessages.length === 0 ? (
      <EmptyChat />
    ) : (
      <VirtualizedChatMessages messages={filteredMessages} ref={listRef} scrollToBottom={scrollToBottom} />
    );
  },
);

const PinnedBy = ({
  messageId,
  index,
  rowRef,
}: {
  messageId: string;
  index: number;
  rowRef?: React.MutableRefObject<HTMLDivElement | null>;
}) => {
  const pinnedBy = usePinnedBy(messageId);
  const localPeerName = useHMSStore(selectLocalPeerName);

  useLayoutEffect(() => {
    if (rowRef?.current) {
      if (pinnedBy) {
        rowRef.current.style.background =
          'linear-gradient(277deg, var(--hms-ui-colors-surface_default) 0%, var(--hms-ui-colors-surface_dim) 60.87%)';
      } else {
        rowRef.current.style.background = '';
      }
      setRowHeight(index, messageId, rowRef?.current.clientHeight);
    }
  }, [index, messageId, pinnedBy, rowRef]);

  if (!pinnedBy) {
    return null;
  }

  return (
    <Flex align="center" css={{ gap: '$2', mb: '$2', color: '$on_surface_low' }}>
      <SolidPinIcon height={12} width={12} />
      <Text variant="xs" css={{ color: 'inherit' }}>
        Pinned by {localPeerName === pinnedBy ? 'you' : pinnedBy}
      </Text>
    </Flex>
  );
};
