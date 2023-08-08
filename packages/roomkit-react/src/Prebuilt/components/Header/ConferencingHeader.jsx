import React, { useMemo } from 'react';
import { HMSRoomState, selectRoomState, useHMSStore } from '@100mslive/react-sdk';
import { Flex } from '../../../';
import { Logo, SpeakerTag } from './HeaderComponents';
import { StreamActions } from './StreamActions';

export const ConferencingHeader = () => {
  const roomState = useHMSStore(selectRoomState);
  const isPreview = useMemo(() => {
    return roomState !== HMSRoomState.Preview;
  }, [roomState]);
  return (
    <Flex justify="space-between" align="center" css={{ position: 'relative', height: '100%', p: '$10' }}>
      <Flex align="center">
        <Logo />
      </Flex>
      <Flex justify="center" align="center" css={{ flexGrow: '1' }}>
        {!isPreview ? <SpeakerTag /> : null}
      </Flex>

      <Flex
        align="center"
        css={{
          gap: '$4',
        }}
      >
        <StreamActions />
      </Flex>
    </Flex>
  );
};
