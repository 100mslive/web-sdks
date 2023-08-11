import React from 'react';
import { useMedia } from 'react-use';
import { HMSRoomState, selectRoomState, useHMSStore } from '@100mslive/react-sdk';
import { config as cssConfig, Flex, VerticalDivider } from '../../../';
import { Logo, SpeakerTag } from './HeaderComponents';
import { StreamActions } from './StreamActions';
import { AudioOutputActions, CamaraFlipActions } from './common';

export const ConferencingHeader = () => {
  const roomState = useHMSStore(selectRoomState);
  const isMobile = useMedia(cssConfig.media.md);
  const isPreview = roomState === HMSRoomState.Preview;

  return (
    <Flex justify="between" align="center" css={{ position: 'relative', height: '100%' }}>
      <Flex align="center" css={{ position: 'absolute', left: '$10' }}>
        <Logo />
        {!isPreview ? (
          <>
            <VerticalDivider css={{ ml: '$8' }} /> <SpeakerTag />
          </>
        ) : null}
      </Flex>

      <Flex
        align="center"
        css={{
          position: 'absolute',
          right: '$10',
          gap: '$4',
        }}
      >
        {!isPreview && <StreamActions />}
        {!isPreview && isMobile && <CamaraFlipActions />}
        {!isPreview && isMobile && <AudioOutputActions />}
      </Flex>
    </Flex>
  );
};
