import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useMedia } from 'react-use';
import { selectLocalPeerID, selectLocalPeerName, selectSessionStore } from '@100mslive/hms-video-store';
import {
  HMSNotificationTypes,
  selectHMSMessagesCount,
  selectPeerNameByID,
  useHMSActions,
  useHMSNotifications,
  useHMSStore,
} from '@100mslive/react-sdk';
import { ChevronDownIcon } from '@100mslive/react-icons';
import { Button } from '../../../Button';
import { Flex } from '../../../Layout';
import { config as cssConfig } from '../../../Theme';
import { ChatBody } from './ChatBody';
import { ChatFooter } from './ChatFooter';
import { ChatBlocked, ChatPaused } from './ChatStates';
import { PinnedMessage } from './PinnedMessage';
import { useRoomLayoutConferencingScreen } from '../../provider/roomLayoutProvider/hooks/useRoomLayoutScreen';
import { useSetSubscribedChatSelector } from '../AppData/useUISettings';
import { useSetPinnedMessages } from '../hooks/useSetPinnedMessages';
import { useUnreadCount } from './useUnreadCount';
import { CHAT_SELECTOR, SESSION_STORE_KEY } from '../../common/constants';

export const Chat = ({ screenType }) => {
  const notification = useHMSNotifications(HMSNotificationTypes.PEER_LEFT);
  const [peerSelector, setPeerSelector] = useSetSubscribedChatSelector(CHAT_SELECTOR.PEER_ID);
  const [roleSelector, setRoleSelector] = useSetSubscribedChatSelector(CHAT_SELECTOR.ROLE);
  const peerName = useHMSStore(selectPeerNameByID(peerSelector));
  const localPeerId = useHMSStore(selectLocalPeerID);
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
  const blacklistedPeerIDSet = new Set(useHMSStore(selectSessionStore(SESSION_STORE_KEY.CHAT_PEER_BLACKLIST)) || []);
  const isLocalPeerBlacklisted = blacklistedPeerIDSet.has(localPeerId);
  const storeMessageSelector = selectHMSMessagesCount;
  const localPeerName = useHMSStore(selectLocalPeerName);
  const { elements } = useRoomLayoutConferencingScreen();
  const { can_disable_chat } = elements?.chat.real_time_controls || false;
  const { enabled: isChatEnabled, updatedBy: chatStateUpdatedBy } = useHMSStore(
    selectSessionStore(SESSION_STORE_KEY.CHAT_STATE),
  ) || { enabled: true, updatedBy: '' };
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
        blacklistedPeerIDSet={blacklistedPeerIDSet}
      />

      {!isChatEnabled ? (
        <ChatPaused
          canUnpauseChat={can_disable_chat}
          pausedBy={chatStateUpdatedBy}
          unPauseChat={() =>
            hmsActions.sessionStore.set(SESSION_STORE_KEY.CHAT_STATE, { enabled: true, updatedBy: localPeerName })
          }
        />
      ) : null}

      {isLocalPeerBlacklisted ? <ChatBlocked /> : null}

      {isMobile && elements?.chat?.is_overlay && elements?.chat?.allow_pinning_messages ? (
        <PinnedMessage clearPinnedMessage={removePinnedMessage} />
      ) : null}

      {isChatEnabled && !isLocalPeerBlacklisted ? (
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
      ) : null}
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
