import React, { useEffect, useState } from 'react';
import { Flex } from '../../../Layout';
import { Text } from '../../../Text';
import { getFormattedTime } from '../Polls/common/utils';

export const Duration = ({ timestamp }: { timestamp: Date }) => {
  const [elapsedTime, setElapsedTime] = useState(getFormattedTime(Date.now() - timestamp.getTime(), false));

  useEffect(() => {
    const timerAdded = setInterval(() => {
      setElapsedTime(getFormattedTime(Date.now() - timestamp.getTime(), false));
    }, 1000);

    return () => {
      clearInterval(timerAdded);
    };
  }, [timestamp]);

  return (
    <Flex css={{ color: 'onSurface.medium' }}>
      <Text variant="xs" css={{ color: 'inherit' }}>
        Started {elapsedTime} ago
      </Text>
    </Flex>
  );
};
