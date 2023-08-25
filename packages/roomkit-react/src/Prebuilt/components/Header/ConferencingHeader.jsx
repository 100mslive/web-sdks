import React from 'react';
import { Flex } from '../../../';
import { SpeakerTag } from './HeaderComponents';
import { ParticipantCount } from './ParticipantList';
import { StreamActions } from './StreamActions';

export const ConferencingHeader = () => {
  return (
    <Flex justify="between" align="center" css={{ position: 'relative', height: '100%' }}>
      <Flex align="center" css={{ position: 'absolute', left: '$10' }}>
        <SpeakerTag />
      </Flex>

      <Flex
        align="center"
        css={{
          position: 'absolute',
          right: '$10',
          gap: '$4',
        }}
      >
        <StreamActions />
        <ParticipantCount />
      </Flex>
    </Flex>
  );
};
