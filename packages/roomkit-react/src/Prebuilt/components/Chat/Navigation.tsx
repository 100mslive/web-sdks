import React from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@100mslive/react-icons';
import { Flex } from '../../../Layout';

export const Navigation = ({
  total,
  index,
  showPrevious,
  showNext,
}: {
  total: number;
  index: number;
  showPrevious: () => void;
  showNext: () => void;
}) => {
  return total > 1 ? (
    <Flex direction="column" css={{ gap: '$1' }}>
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
  ) : null;
};
