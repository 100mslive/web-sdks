import React, { useEffect, useState } from 'react';
import { Flex } from '../../../Layout';
import { Text } from '../../../Text';
import { getFormattedTime } from '../Polls/common/utils';

export const Duration = ({ timeStamp }: { timeStamp: Date }) => {
  const [elapsedTime, setElapsedTime] = useState(getFormattedTime(Date.now() - timeStamp.getTime(), false));

  useEffect(() => {
    const timerAdded = setInterval(() => {
      setElapsedTime(getFormattedTime(Date.now() - timeStamp.getTime(), false));
    }, 1000);

    return () => {
      clearInterval(timerAdded);
    };
  }, [timeStamp]);

  return (
    <Flex css={{ color: '$on_surface_medium' }}>
      <Text variant="xs" css={{ color: 'inherit' }}>
        Started {elapsedTime} ago
      </Text>
    </Flex>
  );
};
