import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSwipeable } from 'react-swipeable';
import { useMedia } from 'react-use';
import { selectPermissions, selectSessionStore, useHMSStore } from '@100mslive/react-sdk';
import { CrossIcon, PinIcon } from '@100mslive/react-icons';
import { Box, Flex } from '../../../Layout';
import { Text } from '../../../Text';
import { config as cssConfig } from '../../../Theme';
// @ts-ignore
import { AnnotisedMessage } from './ChatBody';
// @ts-ignore
import { PinnedMessageNavigation } from './PinnedMessageNavigation';
// @ts-ignore
import { SESSION_STORE_KEY } from '../../common/constants';

const PINNED_MESSAGE_LENGTH = 75;

export const PinnedMessage = ({ clearPinnedMessage }: { clearPinnedMessage: (index: number) => void }) => {
  const permissions = useHMSStore(selectPermissions);
  const pinnedMessages = useHMSStore(selectSessionStore(SESSION_STORE_KEY.PINNED_MESSAGES)) || [];
  const [pinnedMessageIndex, setPinnedMessageIndex] = useState(0);
  const isMobile = useMedia(cssConfig.media.md);

  const [hideOverflow, setHideOverflow] = useState(false);

  const formattedPinnedMessage = hideOverflow
    ? `${pinnedMessages?.[pinnedMessageIndex]?.text.slice(0, PINNED_MESSAGE_LENGTH)}... `
    : pinnedMessages?.[pinnedMessageIndex]?.text;

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

  useEffect(() => {
    setHideOverflow(
      !!(
        pinnedMessages?.[pinnedMessageIndex]?.text?.length &&
        pinnedMessages?.[pinnedMessageIndex]?.text.length > PINNED_MESSAGE_LENGTH
      ),
    );
  }, [pinnedMessageIndex, pinnedMessages]);

  return pinnedMessages?.[pinnedMessageIndex]?.text ? (
    <Flex ref={pinnedMessageRef} align="center" css={{ w: '100%', gap: '$4' }}>
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
            w: '100%',
            maxHeight: '$18',
            overflowY: 'auto',
            '& p span': {
              color: '$primary_default',
            },
          }}
        >
          <Text variant="sm" css={{ color: '$on_surface_medium' }} {...swipeHandlers}>
            <AnnotisedMessage message={formattedPinnedMessage} />
            {hideOverflow ? <span onClick={() => setHideOverflow(false)}>See more</span> : null}
          </Text>
        </Box>
        {permissions?.removeOthers && (
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
