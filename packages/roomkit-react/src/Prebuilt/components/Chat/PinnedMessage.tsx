import React, { useState } from 'react';
import { useSwipeable } from 'react-swipeable';
import { useMedia } from 'react-use';
import { selectSessionStore, useHMSStore } from '@100mslive/react-sdk';
import { UnpinIcon } from '@100mslive/react-icons';
import { Box, Flex } from '../../../Layout';
import { Text } from '../../../Text';
import { config as cssConfig } from '../../../Theme';
import { ArrowNavigation } from './ArrowNavigation';
// @ts-ignore
import { AnnotisedMessage } from './ChatBody';
import { StickIndicator } from './StickIndicator';
import { useRoomLayoutConferencingScreen } from '../../provider/roomLayoutProvider/hooks/useRoomLayoutScreen';
import { SESSION_STORE_KEY } from '../../common/constants';

const PINNED_MESSAGE_LENGTH = 75;

export const PinnedMessage = ({ clearPinnedMessage }: { clearPinnedMessage: (index: number) => void }) => {
  const pinnedMessages = useHMSStore(selectSessionStore(SESSION_STORE_KEY.PINNED_MESSAGES));
  const [pinnedMessageIndex, setPinnedMessageIndex] = useState(0);
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

  if (!(pinnedMessages?.length > 0)) {
    return null;
  }

  return (
    <Flex align="center" css={{ w: '100%', gap: '$4' }}>
      {!isMobile ? (
        <ArrowNavigation
          index={pinnedMessageIndex}
          total={pinnedMessages.length}
          showPrevious={showPreviousPinnedMessage}
          showNext={showNextPinnedMessage}
        />
      ) : null}
      <Flex
        title={pinnedMessages[pinnedMessageIndex].text}
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
        {isMobile ? <StickIndicator index={pinnedMessageIndex} total={pinnedMessages.length} /> : null}

        <Box
          css={{
            w: '100%',
            maxHeight: '$18',
            overflowY: 'auto',
            overflowX: 'hidden',
            wordBreak: 'break-word',
            '& p span': {
              color: '$primary_default',
            },
          }}
        >
          <Text variant="sm" css={{ color: '$on_surface_medium' }} {...swipeHandlers}>
            <AnnotisedMessage
              message={`${currentPinnedMessage.slice(
                0,
                hideOverflow ? PINNED_MESSAGE_LENGTH : currentPinnedMessage.length,
              )}${hideOverflow ? '...' : ''}`}
            />
            {canOverflow ? (
              <span style={{ cursor: 'pointer' }} onClick={() => setHideOverflow(prev => !prev)}>
                &nbsp;{hideOverflow ? 'See more' : 'Collapse'}
              </span>
            ) : null}
          </Text>
        </Box>

        {canUnpinMessage ? (
          <Flex
            onClick={() => {
              clearPinnedMessage(pinnedMessageIndex);
              setPinnedMessageIndex(Math.max(0, pinnedMessageIndex - 1));
            }}
            css={{ cursor: 'pointer', color: '$on_surface_medium', '&:hover': { color: '$on_surface_high' } }}
          >
            <UnpinIcon height={20} width={20} />
          </Flex>
        ) : null}
      </Flex>
    </Flex>
  );
};
