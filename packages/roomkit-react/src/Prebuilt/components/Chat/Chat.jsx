import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSwipeable } from 'react-swipeable';
import { useMedia } from 'react-use';
import {
  HMSNotificationTypes,
  selectHMSMessagesCount,
  selectPeerNameByID,
  selectPermissions,
  selectSessionStore,
  useHMSActions,
  useHMSNotifications,
  useHMSStore,
} from '@100mslive/react-sdk';
import { ChevronDownIcon, CrossIcon, PinIcon } from '@100mslive/react-icons';
import { Button } from '../../../Button';
import { Box, Flex } from '../../../Layout';
import { Text } from '../../../Text';
import { config as cssConfig } from '../../../Theme';
import { AnnotisedMessage, ChatBody } from './ChatBody';
import { ChatFooter } from './ChatFooter';
import { PinnedMessageNavigation } from './PinnedMessageNavigation';
import { useRoomLayoutConferencingScreen } from '../../provider/roomLayoutProvider/hooks/useRoomLayoutScreen';
import { useSetSubscribedChatSelector } from '../AppData/useUISettings';
import { useSetPinnedMessages } from '../hooks/useSetPinnedMessages';
import { useUnreadCount } from './useUnreadCount';
import { CHAT_SELECTOR, SESSION_STORE_KEY } from '../../common/constants';

const PINNED_MESSAGE_LENGTH = 80;

const PinnedMessage = ({ clearPinnedMessage }) => {
  const permissions = useHMSStore(selectPermissions);
  const pinnedMessages = useHMSStore(selectSessionStore(SESSION_STORE_KEY.PINNED_MESSAGES)) || [];
  const [pinnedMessageIndex, setPinnedMessageIndex] = useState(0);
  const isMobile = useMedia(cssConfig.media.md);

  const formattedPinnedMessage =
    pinnedMessages?.[pinnedMessageIndex]?.length && pinnedMessages?.[pinnedMessageIndex].length > PINNED_MESSAGE_LENGTH
      ? `${pinnedMessages?.[pinnedMessageIndex].slice(0, PINNED_MESSAGE_LENGTH)}...`
      : pinnedMessages?.[pinnedMessageIndex];

  const pinnedMessageRef = useRef(null);
  const showPreviousPinnedMessage = useCallback(
    () => setPinnedMessageIndex(currentIndex => Math.max(currentIndex - 1, 0)),
    [],
  );

  const showNextPinnedMessage = useCallback(
    () => setPinnedMessageIndex(currentIndex => Math.min(currentIndex + 1, pinnedMessages.length - 1)),
    [pinnedMessages],
  );

  const swipeHandlers = useSwipeable({
    onSwipedUp: () => showNextPinnedMessage(),
    onSwipedDown: () => showPreviousPinnedMessage(),
  });

  return pinnedMessages?.[pinnedMessageIndex] ? (
    <Flex ref={pinnedMessageRef} align="center" css={{ w: '100%', gap: '$4' }}>
      <Flex
        title={pinnedMessages?.[pinnedMessageIndex]}
        css={{
          p: '$4',
          color: '$on_surface_medium',
          bg: isMobile ? 'rgba(0, 0, 0, 0.64)' : '$surface_default',
          r: '$1',
          gap: '$4',
          mb: '$8',
          mt: '$8',
          flexGrow: 1,
        }}
        align="center"
        justify="between"
      >
        <PinnedMessageNavigation
          pinnedMessageIndex={pinnedMessageIndex}
          pinnedMessages={pinnedMessages}
          showPreviousPinnedMessage={showPreviousPinnedMessage}
          showNextPinnedMessage={showNextPinnedMessage}
          isMobile={isMobile}
        />
        <PinIcon />

        <Box
          css={{
            color: '$on_surface_medium',
            w: '100%',
            maxHeight: '$18',
            overflowY: 'auto',
          }}
        >
          <Text variant="sm" {...swipeHandlers}>
            <AnnotisedMessage message={formattedPinnedMessage} />
          </Text>
        </Box>
        {permissions.removeOthers && (
          <Flex
            onClick={() => {
              clearPinnedMessage(pinnedMessageIndex);
              setPinnedMessageIndex(Math.max(0, pinnedMessageIndex - 1));
            }}
            css={{ cursor: 'pointer', color: '$on_surface_medium', '&:hover': { color: '$on_surface_high' } }}
          >
            <CrossIcon />
          </Flex>
        )}
      </Flex>
    </Flex>
  ) : null;
};

export const Chat = ({ screenType }) => {
  const notification = useHMSNotifications(HMSNotificationTypes.PEER_LEFT);
  const [peerSelector, setPeerSelector] = useSetSubscribedChatSelector(CHAT_SELECTOR.PEER_ID);
  const [roleSelector, setRoleSelector] = useSetSubscribedChatSelector(CHAT_SELECTOR.ROLE);
  const peerName = useHMSStore(selectPeerNameByID(peerSelector));
  const [chatOptions, setChatOptions] = useState({
    role: roleSelector || '',
    peerId: peerSelector && peerName ? peerSelector : '',
    selection: roleSelector ? roleSelector : peerSelector && peerName ? peerName : 'Everyone',
  });
  const [isSelectorOpen] = useState(false);
  const listRef = useRef(null);
  const hmsActions = useHMSActions();
  const { removePinnedMessage } = useSetPinnedMessages();

  useEffect(() => {
    if (notification && notification.data && peerSelector === notification.data.id) {
      setPeerSelector('');
      setChatOptions({
        role: '',
        peerId: '',
        selection: 'Everyone',
      });
    }
  }, [notification, peerSelector, setPeerSelector]);

  const storeMessageSelector = selectHMSMessagesCount;
  const { elements } = useRoomLayoutConferencingScreen();
  const isMobile = useMedia(cssConfig.media.md);

  let isScrolledToBottom = false;
  if (listRef.current) {
    const currentRef = listRef.current._outerRef;
    isScrolledToBottom = currentRef.scrollHeight - currentRef.clientHeight - currentRef.scrollTop < 10;
  }

  const messagesCount = useHMSStore(storeMessageSelector) || 0;
  const scrollToBottom = useCallback(
    (unreadCount = 0) => {
      if (listRef.current && listRef.current.scrollToItem && unreadCount > 0) {
        listRef.current?.scrollToItem(messagesCount, 'end');
        requestAnimationFrame(() => {
          listRef.current?.scrollToItem(messagesCount, 'end');
        });
        hmsActions.setMessageRead(true);
      }
    },
    [hmsActions, messagesCount],
  );

  return (
    <Flex
      direction="column"
      css={{
        size: '100%',
        gap: '$4',
      }}
    >
      {isMobile && elements?.chat?.is_overlay ? null : (
        <>
          {elements?.chat?.allow_pinning_messages ? <PinnedMessage clearPinnedMessage={removePinnedMessage} /> : null}
        </>
      )}

      <ChatBody
        role={chatOptions.role}
        peerId={chatOptions.peerId}
        ref={listRef}
        scrollToBottom={scrollToBottom}
        screenType={screenType}
      />

      {isMobile && elements?.chat?.is_overlay && elements?.chat?.allow_pinning_messages ? (
        <PinnedMessage clearPinnedMessage={removePinnedMessage} />
      ) : null}

      <ChatFooter
        role={chatOptions.role}
        onSend={() => scrollToBottom(1)}
        selection={chatOptions.selection}
        screenType={screenType}
        onSelect={({ role, peerId, selection }) => {
          setChatOptions({
            role,
            peerId,
            selection,
          });
          setPeerSelector(peerId);
          setRoleSelector(role);
        }}
        peerId={chatOptions.peerId}
      >
        {!isSelectorOpen && !isScrolledToBottom && (
          <NewMessageIndicator role={chatOptions.role} peerId={chatOptions.peerId} scrollToBottom={scrollToBottom} />
        )}
      </ChatFooter>
    </Flex>
  );
};

const NewMessageIndicator = ({ role, peerId, scrollToBottom }) => {
  const unreadCount = useUnreadCount({ role, peerId });
  if (!unreadCount) {
    return null;
  }
  return (
    <Flex
      justify="center"
      css={{
        width: '100%',
        left: 0,
        bottom: '100%',
        position: 'absolute',
      }}
    >
      <Button
        variant="standard"
        onClick={() => {
          scrollToBottom(unreadCount);
        }}
        icon
        css={{
          p: '$4',
          pl: '$8',
          pr: '$6',
          '& > svg': { ml: '$4' },
          borderRadius: '$round',
          position: 'relative',
          bottom: '$16',
          fontSize: '$xs',
          fontWeight: '$semiBold',
          c: '$on_secondary_high',
        }}
      >
        New {unreadCount === 1 ? 'message' : 'messages'}
        <ChevronDownIcon />
      </Button>
    </Flex>
  );
};
