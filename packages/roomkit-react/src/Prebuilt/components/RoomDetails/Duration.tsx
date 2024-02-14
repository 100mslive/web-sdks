import React, { useEffect, useState } from 'react';
import { Flex } from '../../../Layout';
import { Loading } from '../../../Loading';
import { Text } from '../../../Text';
import { getFormattedTime } from '../Polls/common/utils';

export const Duration = ({ timeStamp }: { timeStamp: Date }) => {
  const [elapsedTime, setElapsedTime] = useState('');

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
      {elapsedTime ? (
        <Text variant="xs" css={{ color: 'inherit' }}>
          Started {elapsedTime} ago
        </Text>
      ) : (
        <Loading size={16} />
      )}
    </Flex>
  );
};
