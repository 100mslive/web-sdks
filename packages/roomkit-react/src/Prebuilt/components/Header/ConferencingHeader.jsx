import React from 'react';
import { useMedia } from 'react-use';
import { HMSRoomState, selectRoomState, useHMSStore } from '@100mslive/react-sdk';
import { config as cssConfig, Flex, VerticalDivider } from '../../../';
import { Logo, SpeakerTag } from './HeaderComponents';
import { LiveStatus, RecordingStatus, StreamActions } from './StreamActions';
import { useShowStreamingUI } from '../../common/hooks';
import { AudioOutputActions, CamaraFlipActions } from './common';

export const ConferencingHeader = () => {
  const roomState = useHMSStore(selectRoomState);
  const isMobile = useMedia(cssConfig.media.md);
  const isPreview = roomState === HMSRoomState.Preview;
  const showStreamingUI = useShowStreamingUI();
  // no header if there in preview
  if (isPreview) {
    return <></>;
  }
  return (
    <Flex justify="between" align="center" css={{ position: 'relative', height: '100%' }}>
      <Flex align="center" gap="2" css={{ position: 'absolute', left: '$10' }}>
        {!showStreamingUI ? (
          <>
            <Logo />
            <VerticalDivider style={{ marginLeft: '0.5rem' }} />
          </>
        ) : null}
        <SpeakerTag />
        {isMobile && (
          <Flex align="center" css={{ gap: '$4' }}>
            <LiveStatus />
            <RecordingStatus />
          </Flex>
        )}
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
        {isMobile && (
          <>
            <CamaraFlipActions />
            <AudioOutputActions />
          </>
        )}
      </Flex>
    </Flex>
  );
};
