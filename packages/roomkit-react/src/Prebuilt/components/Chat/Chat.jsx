import React, { useCallback, useRef, useState } from 'react';
import { useMedia } from 'react-use';
import { selectLocalPeer, selectSessionStore, selectUnreadHMSMessagesCount } from '@100mslive/hms-video-store';
import { selectHMSMessagesCount, useHMSActions, useHMSStore } from '@100mslive/react-sdk';
import { ChevronDownIcon } from '@100mslive/react-icons';
import { Button } from '../../../Button';
import { Flex } from '../../../Layout';
import { config as cssConfig } from '../../../Theme';
import { ChatBody } from './ChatBody';
import { ChatFooter } from './ChatFooter';
import { ChatBlocked, ChatPaused } from './ChatStates';
import { PinnedMessage } from './PinnedMessage';
import { useRoomLayoutConferencingScreen } from '../../provider/roomLayoutProvider/hooks/useRoomLayoutScreen';
import { useSetPinnedMessages } from '../hooks/useSetPinnedMessages';
import { SESSION_STORE_KEY } from '../../common/constants';

export const Chat = () => {
  const { elements, screenType } = useRoomLayoutConferencingScreen();
  const localPeer = useHMSStore(selectLocalPeer);
  const [isSelectorOpen] = useState(false);
  const listRef = useRef(null);
  const hmsActions = useHMSActions();
  const { removePinnedMessage } = useSetPinnedMessages();
  const pinnedMessages = useHMSStore(selectSessionStore(SESSION_STORE_KEY.PINNED_MESSAGES)) || [];

  const blacklistedPeerIDs = useHMSStore(selectSessionStore(SESSION_STORE_KEY.CHAT_PEER_BLACKLIST)) || [];
  const blacklistedPeerIDSet = new Set(blacklistedPeerIDs);
  const isLocalPeerBlacklisted = blacklistedPeerIDSet.has(localPeer?.customerUserId);
  const storeMessageSelector = selectHMSMessagesCount;
  const { enabled: isChatEnabled = true } = useHMSStore(selectSessionStore(SESSION_STORE_KEY.CHAT_STATE)) || {};
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
          <PinnedMessage clearPinnedMessage={index => removePinnedMessage(pinnedMessages, index)} />
        </>
      )}

      <ChatBody ref={listRef} scrollToBottom={scrollToBottom} screenType={screenType} />

      <ChatPaused />

      {isLocalPeerBlacklisted ? <ChatBlocked /> : null}

      {isMobile && elements?.chat?.is_overlay ? (
        <PinnedMessage clearPinnedMessage={index => removePinnedMessage(pinnedMessages, index)} />
      ) : null}

      {isChatEnabled && !isLocalPeerBlacklisted ? (
        <ChatFooter onSend={() => scrollToBottom(1)} screenType={screenType}>
          {!isSelectorOpen && !isScrolledToBottom && <NewMessageIndicator scrollToBottom={scrollToBottom} />}
        </ChatFooter>
      ) : null}
    </Flex>
  );
};

const NewMessageIndicator = ({ scrollToBottom }) => {
  const unreadCount = useHMSStore(selectUnreadHMSMessagesCount);
  if (!unreadCount) {
    return null;
  }
  return (
    <Flex
      justify="center"
      css={{
        width: '100%',
        left: 0,
        bottom: '$28',
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
          p: '$3 $4',
          pl: '$6',
          '& > svg': { ml: '$4' },
          borderRadius: '$round',
          fontSize: '$xs',
          fontWeight: '$semiBold',
          c: '$on_secondary_high',
        }}
      >
        New {unreadCount === 1 ? 'message' : 'messages'}
        <ChevronDownIcon height={16} width={16} />
      </Button>
    </Flex>
  );
};
