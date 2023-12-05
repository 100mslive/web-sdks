import React from 'react';
import { CheckCircleIcon, TrophyFilledIcon } from '@100mslive/react-icons';
import { Box, Flex } from '../../../../Layout';
import { Text } from '../../../../Text';

export const LeaderboardEntry = ({
  position,
  score,
  totalResponses,
  correctResponses,
  userName,
  maxPossibleScore,
}: {
  position: number;
  score: number;
  totalResponses: number;
  correctResponses: number;
  userName: string;
  maxPossibleScore: number;
}) => {
  const positionColorMap: Record<number, string> = { 1: '#D69516', 2: '#3E3E3E', 3: '#583B0F' };
  return (
    <Flex align="center" justify="between">
      <Flex align="center" css={{ gap: '$6' }}>
        <Flex
          align="center"
          justify="center"
          css={{
            backgroundColor: positionColorMap[position] || '',
            h: '$10',
            w: '$10',
            borderRadius: '$round',
            color: position > 3 ? '$on_surface_low' : '#FFF',
            fontSize: '$xs',
            fontWeight: '$semiBold',
          }}
        >
          {position}
        </Flex>

        <Box>
          <Text variant="sm" css={{ fontWeight: '$semiBold', color: '$on_surface_high' }}>
            {userName}
          </Text>

          <Text variant="sm">
            {score}/{maxPossibleScore} points
          </Text>
        </Box>
      </Flex>
      <Flex align="center" css={{ gap: '$6', color: '$on_surface_medium' }}>
        {position === 1 ? <TrophyFilledIcon /> : null}
        <CheckCircleIcon height={16} width={16} />
        <Text variant="xs">
          {correctResponses}/{totalResponses}
        </Text>
      </Flex>
    </Flex>
  );
};
