import React from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@100mslive/react-icons';
import { Box, Flex } from '../../../Layout';

export const PinnedMessageNavigation = ({
  pinnedMessages,
  pinnedMessageIndex,
  showPreviousPinnedMessage,
  showNextPinnedMessage,
  isMobile,
}) => {
  const sticksCount = Math.min(3, pinnedMessages.length);

  if (pinnedMessages.length < 2) {
    return null;
  }

  return isMobile ? (
    <Flex direction="column" css={{ gap: '$1' }}>
      {[...Array(sticksCount)].map((_, index) => (
        <Box
          css={{
            borderLeft: '2px solid',
            height: '$8',
            borderColor: index === pinnedMessageIndex ? '$on_surface_high' : '$on_surface_low',
          }}
        />
      ))}
    </Flex>
  ) : (
    <Flex direction="column" css={{ gap: '$4' }}>
      <Flex
        onClick={showPreviousPinnedMessage}
        css={
          pinnedMessageIndex === 0
            ? { cursor: 'not-allowed', color: '$on_surface_low' }
            : { cursor: 'pointer', color: '$on_surface_medium' }
        }
      >
        <ChevronUpIcon height={20} width={20} />
      </Flex>
      <Flex
        onClick={showNextPinnedMessage}
        css={
          pinnedMessageIndex === pinnedMessages.length - 1
            ? { cursor: 'not-allowed', color: '$on_surface_low' }
            : { cursor: 'pointer', color: '$on_surface_medium' }
        }
      >
        <ChevronDownIcon height={20} width={20} />
      </Flex>
    </Flex>
  );
};
