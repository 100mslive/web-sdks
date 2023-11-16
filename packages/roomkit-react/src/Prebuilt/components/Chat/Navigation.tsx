import React from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@100mslive/react-icons';
import { Box, Flex } from '../../../Layout';

export const Navigation = ({
  total,
  index,
  showPrevious,
  showNext,
  isMobile,
}: {
  total: number;
  index: number;
  showPrevious: () => void;
  showNext: () => void;
  isMobile: boolean;
}) => {
  const sticksCount = Math.min(3, total);

  if (total < 2) {
    return null;
  }

  return isMobile ? (
    <Flex direction="column" css={{ gap: '$1' }}>
      {[...Array(sticksCount)].map((_, i) => (
        <Box
          css={{
            borderLeft: '2px solid',
            height: '$8',
            borderColor: i === index ? '$on_surface_high' : '$on_surface_low',
          }}
        />
      ))}
    </Flex>
  ) : (
    <Flex direction="column" css={{ gap: '$4' }}>
      <Flex
        onClick={showPrevious}
        css={
          index === 0
            ? { cursor: 'not-allowed', color: '$on_surface_low' }
            : { cursor: 'pointer', color: '$on_surface_medium' }
        }
      >
        <ChevronUpIcon height={20} width={20} />
      </Flex>
      <Flex
        onClick={showNext}
        css={
          index === total - 1
            ? { cursor: 'not-allowed', color: '$on_surface_low' }
            : { cursor: 'pointer', color: '$on_surface_medium' }
        }
      >
        <ChevronDownIcon height={20} width={20} />
      </Flex>
    </Flex>
  );
};
