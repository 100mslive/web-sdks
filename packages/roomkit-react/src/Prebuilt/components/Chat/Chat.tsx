import { MutableRefObject, useCallback, useRef } from 'react';
import { useMedia } from 'react-use';
import { VariableSizeList } from 'react-window';
import { selectSessionStore, selectUnreadHMSMessagesCount } from '@100mslive/hms-video-store';
import { match } from 'ts-pattern';
import { selectHMSMessagesCount, useHMSActions, useHMSStore, useHMSVanillaStore } from '@100mslive/react-sdk';
import { ChevronDownIcon } from '@100mslive/react-icons';
import { Button } from '../../../Button';
import { Box, Flex } from '../../../Layout';
import { config as cssConfig } from '../../../Theme';
// @ts-ignore: No implicit Any
import { EmojiReaction } from '../EmojiReaction';
import { MoreSettings } from '../MoreSettings/MoreSettings';
import { RaiseHand } from '../RaiseHand';
import { ChatBody } from './ChatBody';
import { ChatFooter } from './ChatFooter';
import { ChatBlocked, ChatPaused } from './ChatStates';
import { PinnedMessage } from './PinnedMessage';
import { useRoomLayoutConferencingScreen } from '../../provider/roomLayoutProvider/hooks/useRoomLayoutScreen';
import { useSidepaneResetOnLayoutUpdate } from '../AppData/useSidepaneResetOnLayoutUpdate';
import { useIsPeerBlacklisted } from '../hooks/useChatBlacklist';
import { useLandscapeHLSStream, useMobileHLSStream } from '../../common/hooks';
import { SESSION_STORE_KEY, SIDE_PANE_OPTIONS } from '../../common/constants';

export const Chat = () => {
  const { elements, screenType } = useRoomLayoutConferencingScreen();
  const listRef = useRef<VariableSizeList | null>(null);
  const hmsActions = useHMSActions();
  const vanillaStore = useHMSVanillaStore();
  const { enabled: isChatEnabled = true } = useHMSStore(selectSessionStore(SESSION_STORE_KEY.CHAT_STATE)) || {};
  const isMobile = useMedia(cssConfig.media.md);
  const isMobileHLSStream = useMobileHLSStream();
  const isLandscapeStream = useLandscapeHLSStream();
  useSidepaneResetOnLayoutUpdate('chat', SIDE_PANE_OPTIONS.CHAT);
  const isLocalPeerBlacklisted = useIsPeerBlacklisted({ local: true });

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

  const streaming = isMobileHLSStream || isLandscapeStream;

  return (
    <Flex
      direction="column"
      justify="end"
      css={{
        size: '100%',
        gap: '$4',
      }}
    >
      {isMobile && elements?.chat?.is_overlay && !streaming ? null : <PinnedMessage />}
      <ChatBody ref={listRef} scrollToBottom={scrollToBottom} />
      <Flex align="center" css={{ w: '100%', gap: '$2' }}>
        <ChatPaused />
        <ChatBlocked />
        {streaming && (!isChatEnabled || isLocalPeerBlacklisted) && (
          <>
            <RaiseHand css={{ bg: '$surface_default' }} />
            <MoreSettings elements={elements} screenType={screenType} />
          </>
        )}
      </Flex>
      {isMobile && elements?.chat?.is_overlay && !streaming ? <PinnedMessage /> : null}
      {isChatEnabled ? (
        <ChatFooter onSend={scrollToBottom}>
          <NewMessageIndicator scrollToBottom={scrollToBottom} listRef={listRef} />
        </ChatFooter>
      ) : null}
      {streaming && (
        <Box
          css={{
            position: 'absolute',
            ...match({ isLandscapeStream, isMobileHLSStream, isChatEnabled, isLocalPeerBlacklisted })
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
                  isMobileHLSStream: true,
                  isChatEnabled: false,
                },
                () => ({ bottom: '$19', right: '$8' }),
              )
              .with(
                {
                  isMobileHLSStream: true,
                  isChatEnabled: true,
                  isLocalPeerBlacklisted: false,
                },
                () => ({ bottom: '$17', right: '$8' }),
              )
              .with(
                {
                  isLandscapeStream: false,
                  isChatEnabled: true,
                  isLocalPeerBlacklisted: true,
                },
                () => ({ bottom: '$18', right: '$8' }),
              )
              .with(
                {
                  isMobileHLSStream: true,
                  isLocalPeerBlacklisted: true,
                },
                () => ({ bottom: '$20', right: '$8' }),
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
  if (
    outerElement &&
    outerElement.clientHeight + outerElement.scrollTop + outerElement.offsetTop >= outerElement.scrollHeight
  ) {
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
