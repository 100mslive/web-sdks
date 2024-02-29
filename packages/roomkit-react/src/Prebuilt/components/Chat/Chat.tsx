import React, { MutableRefObject, useCallback, useRef } from 'react';
import { useMedia } from 'react-use';
import { VariableSizeList } from 'react-window';
import { selectSessionStore, selectUnreadHMSMessagesCount } from '@100mslive/hms-video-store';
import { match } from 'ts-pattern';
import { selectHMSMessagesCount, useHMSActions, useHMSStore, useHMSVanillaStore } from '@100mslive/react-sdk';
import { ChevronDownIcon } from '@100mslive/react-icons';
import { Button } from '../../../Button';
import { Box, Flex } from '../../../Layout';
import { config as cssConfig } from '../../../Theme';
// @ts-ignore: No implicit any
import { EmojiReaction } from '../EmojiReaction';
import { ChatBody } from './ChatBody';
import { ChatFooter } from './ChatFooter';
import { ChatBlocked, ChatPaused } from './ChatStates';
import { PinnedMessage } from './PinnedMessage';
import { useRoomLayoutConferencingScreen } from '../../provider/roomLayoutProvider/hooks/useRoomLayoutScreen';
import { useLandscapeHLSStream, useMobileHLSStream } from '../../common/hooks';
import { SESSION_STORE_KEY } from '../../common/constants';

export const Chat = () => {
  const { elements } = useRoomLayoutConferencingScreen();
  const listRef = useRef<VariableSizeList | null>(null);
  const hmsActions = useHMSActions();
  const vanillaStore = useHMSVanillaStore();
  const { enabled: isChatEnabled = true } = useHMSStore(selectSessionStore(SESSION_STORE_KEY.CHAT_STATE)) || {};
  const isMobile = useMedia(cssConfig.media.md);
  const isMobileHLSStream = useMobileHLSStream();
  const isLandscapeStream = useLandscapeHLSStream();

  const scrollToBottom = useCallback(
    (unreadCount = 0) => {
      if (listRef.current && listRef.current.scrollToItem && unreadCount > 0) {
        const messagesCount = vanillaStore.getState(selectHMSMessagesCount);
        listRef.current?.scrollToItem(messagesCount, 'end');
        requestAnimationFrame(() => {
          listRef.current?.scrollToItem(messagesCount, 'end');
        });
        hmsActions.setMessageRead(true);
      }
    },
    [hmsActions, vanillaStore],
  );

  return (
    <Flex
      direction="column"
      justify="end"
      css={{
        size: '100%',
        gap: '$4',
      }}
    >
      {isMobile && elements?.chat?.is_overlay ? null : <PinnedMessage />}
      <ChatBody ref={listRef} scrollToBottom={scrollToBottom} />

      <ChatPaused />
      <ChatBlocked />
      {isMobile && elements?.chat?.is_overlay ? <PinnedMessage /> : null}
      {isChatEnabled ? (
        <ChatFooter onSend={scrollToBottom}>
          <NewMessageIndicator scrollToBottom={scrollToBottom} listRef={listRef} />
        </ChatFooter>
      ) : null}
      {(isMobileHLSStream || isLandscapeStream) && (
        <Box
          css={{
            position: 'absolute',
            ...match({ isLandscapeStream, isChatEnabled })
              .with(
                {
                  isLandscapeStream: true,
                  isChatEnabled: true,
                },
                () => ({ bottom: '$19', right: '$10' }),
              )
              .with(
                {
                  isLandscapeStream: true,
                  isChatEnabled: false,
                },
                () => ({ bottom: '$20', right: '$10' }),
              )
              .with(
                {
                  isLandscapeStream: false,
                  isChatEnabled: true,
                },
                () => ({ bottom: '$19', right: '$8' }),
              )
              .otherwise(() => ({})),
          }}
        >
          <EmojiReaction />
        </Box>
      )}
    </Flex>
  );
};

const NewMessageIndicator = ({
  scrollToBottom,
  listRef,
}: {
  scrollToBottom: (count: number) => void;
  listRef: MutableRefObject<VariableSizeList | null>;
}) => {
  const unreadCount = useHMSStore(selectUnreadHMSMessagesCount);
  if (!unreadCount || !listRef.current) {
    return null;
  }
  // @ts-ignore
  const outerElement = listRef.current._outerRef;
  if (outerElement.clientHeight + outerElement.scrollTop + outerElement.offsetTop >= outerElement.scrollHeight) {
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
