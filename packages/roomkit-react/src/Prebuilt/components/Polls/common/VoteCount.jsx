// @ts-check
import React from 'react';
import { Flex, Text } from '../../../../';

export const VoteCount = ({ voteCount }) => {
  return (
    <Flex css={{ alignItems: 'center' }}>
      {voteCount ? (
        <Text variant="sm" css={{ color: '$on_surface_medium' }}>
          {voteCount}&nbsp;
          {voteCount === 1 ? 'vote' : 'votes'}
        </Text>
      ) : null}
    </Flex>
  );
};
