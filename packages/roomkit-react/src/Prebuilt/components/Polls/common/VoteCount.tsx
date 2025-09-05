import React from 'react';
import { Flex, Text } from '../../../../';

export const VoteCount = ({ voteCount }: { voteCount: number }) => {
  return (
    <Flex css={{ alignItems: 'center' }}>
      {voteCount ? (
        <Text variant="sm" css={{ color: 'onSurface.medium' }}>
          {voteCount}&nbsp;
          {voteCount === 1 ? 'vote' : 'votes'}
        </Text>
      ) : null}
    </Flex>
  );
};
