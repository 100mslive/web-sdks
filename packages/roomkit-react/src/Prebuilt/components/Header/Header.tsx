import React from 'react';
import { HMSRoomState, selectRoomState, useHMSStore } from '@100mslive/react-sdk';
import { config as cssConfig, Flex } from '../../..';
// @ts-ignore: No implicit any
import { Logo, SpeakerTag } from './HeaderComponents';
// @ts-ignore: No implicit any
import { RoomDetailsHeader } from './RoomDetailsHeader';
import { LiveStatus, RecordingPauseStatus, RecordingStatus, StreamActions } from './StreamActions';
import { useMedia } from '../../common/useMediaOverride';
// @ts-ignore: No implicit any
import { AudioActions, CamaraFlipActions } from './common';

export const Header = () => {
  const roomState = useHMSStore(selectRoomState);
  const isMobile = useMedia(cssConfig.media.md);
  // Header should be present only inside the call - not in preview, leave room states
  if (roomState !== HMSRoomState.Connected) {
    return <></>;
  }
  return (
    <Flex justify="between" align="center" css={{ position: 'relative', height: '100%' }}>
      <Flex align="center" gap="2" css={{ position: 'absolute', left: '$10' }}>
        <Logo />
        <RoomDetailsHeader />
        <SpeakerTag />
        {isMobile && (
          <Flex align="center" css={{ gap: '$4' }}>
            <LiveStatus />
            <RecordingStatus />
            <RecordingPauseStatus />
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
        {isMobile ? (
          <>
            <CamaraFlipActions />
            <AudioActions />
          </>
        ) : null}
      </Flex>
    </Flex>
  );
};
