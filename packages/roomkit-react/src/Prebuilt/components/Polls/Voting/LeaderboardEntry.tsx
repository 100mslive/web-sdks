import React from 'react';
import { CheckCircleIcon, ClockIcon, TrophyFilledIcon } from '@100mslive/react-icons';
import { Box, Flex } from '../../../../Layout';
import { Text } from '../../../../Text';
import { getFormattedTime } from '../common/utils';

const positionColorMap: Record<number, string> = { 1: '#D69516', 2: '#3E3E3E', 3: '#583B0F' };

export const LeaderboardEntry = ({
  position,
  score,
  questionCount,
  correctResponses,
  userName,
  maxPossibleScore,
  duration,
}: {
  position: number;
  score: number;
  questionCount: number;
  correctResponses: number;
  userName: string;
  maxPossibleScore: number;
  duration: number;
}) => {
  return (
    <Flex align="center" justify="between" css={{ my: '8' }}>
      <Flex align="center" css={{ gap: '6' }}>
        <Flex
          align="center"
          justify="center"
          css={{
            backgroundColor: positionColorMap[position] || '',
            h: '10',
            w: '10',
            borderRadius: 'round',
            color: position > 3 ? 'onSurface.low' : '#FFF',
            fontSize: 'xs',
            fontWeight: 'semiBold',
          }}
        >
          {position}
        </Flex>

        <Box>
          <Text variant="sm" css={{ fontWeight: 'semiBold', color: 'onSurface.high' }}>
            {userName}
          </Text>

          <Text variant="sm" css={{ mt: '1' }}>
            {score} / {maxPossibleScore} points
          </Text>
        </Box>
      </Flex>

      <Flex align="center" css={{ gap: '4', color: 'onSurface.medium' }}>
        {position === 1 && score ? <TrophyFilledIcon height={16} width={16} /> : null}
        {questionCount ? (
          <>
            <CheckCircleIcon height={16} width={16} />
            <Text variant="xs">
              {correctResponses}/{questionCount}
            </Text>
          </>
        ) : null}

        {duration ? (
          <Flex align="center" css={{ gap: '2', color: 'onSurface.medium' }}>
            <ClockIcon height={16} width={16} />
            <Text variant="xs">{getFormattedTime(duration)}</Text>
          </Flex>
        ) : null}
      </Flex>
    </Flex>
  );
};
