import React, { useEffect, useState } from 'react';
import { useSwipeable } from 'react-swipeable';
import { useMedia } from 'react-use';
import { selectSessionStore, useHMSStore } from '@100mslive/react-sdk';
import { PinIcon, UnpinIcon } from '@100mslive/react-icons';
import { Box, Flex } from '../../../Layout';
import { Text } from '../../../Text';
import { config as cssConfig } from '../../../Theme';
import { ArrowNavigation } from './ArrowNavigation';
// @ts-ignore
import { AnnotisedMessage } from './ChatBody';
import { StickIndicator } from './StickIndicator';
import { useRoomLayoutConferencingScreen } from '../../provider/roomLayoutProvider/hooks/useRoomLayoutScreen';
import { usePinnedMessages } from '../hooks/usePinnedMessages';
import { SESSION_STORE_KEY } from '../../common/constants';

const PINNED_MESSAGE_LENGTH = 75;

export const PinnedMessage = () => {
  const pinnedMessages = useHMSStore(selectSessionStore(SESSION_STORE_KEY.PINNED_MESSAGES));
  const [pinnedMessageIndex, setPinnedMessageIndex] = useState(0);
  const { removePinnedMessage } = usePinnedMessages();
  const isMobile = useMedia(cssConfig.media.md);

  const { elements } = useRoomLayoutConferencingScreen();
  const canUnpinMessage = !!elements?.chat?.allow_pinning_messages;

  const [hideOverflow, setHideOverflow] = useState(true);
  const currentPinnedMessage = pinnedMessages?.[pinnedMessageIndex]?.text || '';
  const canOverflow = currentPinnedMessage.length > PINNED_MESSAGE_LENGTH;

  const showPreviousPinnedMessage = () => {
    const previousIndex = Math.max(pinnedMessageIndex - 1, 0);
    setHideOverflow(pinnedMessages[previousIndex].text.length > PINNED_MESSAGE_LENGTH);
    setPinnedMessageIndex(previousIndex);
  };

  const showNextPinnedMessage = () => {
    const nextIndex = Math.min(pinnedMessageIndex + 1, pinnedMessages.length - 1);
    setHideOverflow(pinnedMessages[nextIndex].text.length > PINNED_MESSAGE_LENGTH);
    setPinnedMessageIndex(nextIndex);
  };

  const swipeHandlers = useSwipeable({
    onSwipedUp: () => showNextPinnedMessage(),
    onSwipedDown: () => showPreviousPinnedMessage(),
  });

  // Scenario: User is on a particular index but an earlier message is removed by another peer
  useEffect(() => {
    const count = pinnedMessages?.length || 1;
    if (pinnedMessageIndex >= count) {
      setPinnedMessageIndex(count - 1);
    }
  }, [pinnedMessageIndex, pinnedMessages]);

  if (!pinnedMessages || pinnedMessages.length === 0) {
    return null;
  }

  return (
    <Flex align="center" css={{ w: '100%', gap: '4' }}>
      {!isMobile ? (
        <ArrowNavigation
          index={pinnedMessageIndex}
          total={pinnedMessages.length}
          showPrevious={showPreviousPinnedMessage}
          showNext={showNextPinnedMessage}
        />
      ) : null}
      <Flex
        css={{
          p: '4',
          color: 'onSurface.high',
          bg: isMobile && elements?.chat?.is_overlay ? 'rgba(0, 0, 0, 0.64)' : '$surface_brighter',
          r: '1',
          gap: '4',
          mb: '8',
          mt: '8',
          flexGrow: 1,
          border: '1px solid $border_bright',
        }}
        align="center"
        justify="between"
      >
        {isMobile ? <StickIndicator index={pinnedMessageIndex} total={pinnedMessages.length} /> : null}

        <Box
          css={{
            w: '100%',
            maxHeight: '18',
            overflowY: 'auto',
            overflowX: 'hidden',
            wordBreak: 'break-word',
            '& p span': {
              color: 'primary.default',
            },
          }}
        >
          <Text
            variant="sm"
            css={{ color: 'onSurface.high' }}
            {...swipeHandlers}
            title={pinnedMessages[pinnedMessageIndex]?.text}
          >
            <AnnotisedMessage
              message={currentPinnedMessage}
              length={hideOverflow ? PINNED_MESSAGE_LENGTH : currentPinnedMessage.length}
            />
            {canOverflow ? (
              <span style={{ cursor: 'pointer' }} onClick={() => setHideOverflow(prev => !prev)}>
                &nbsp;{hideOverflow ? '... See more' : 'Collapse'}
              </span>
            ) : null}
          </Text>
        </Box>

        {canUnpinMessage ? (
          <Flex
            onClick={() => {
              removePinnedMessage(pinnedMessageIndex);
              setPinnedMessageIndex(Math.max(0, pinnedMessageIndex - 1));
            }}
            css={{
              cursor: 'pointer',
              color: 'onSurface.medium',
              '&:hover': { color: 'onSurface.high' },
              '&:hover .hide-on-hover': { display: 'none !important' },
              '&:hover .show-on-hover': { display: 'block !important' },
            }}
            title="Unpin Message"
          >
            <UnpinIcon className="show-on-hover" style={{ display: 'none' }} height={20} width={20} />
            <PinIcon className="hide-on-hover" style={{ display: 'block' }} height={20} width={20} />
          </Flex>
        ) : null}
      </Flex>
    </Flex>
  );
};
