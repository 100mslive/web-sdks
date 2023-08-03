import React from 'react';
import { useMedia } from 'react-use';
import { selectDominantSpeaker, selectIsConnectedToRoom, useHMSStore } from '@100mslive/react-sdk';
import { VolumeOneIcon } from '@100mslive/react-icons';
import { config as cssConfig, Flex, styled, Text, textEllipsis } from '../../../';
import { useRoomLayout } from '../../provider/roomLayoutProvider';
import { isStreamingKit } from '../../common/utils';

export const SpeakerTag = () => {
  const dominantSpeaker = useHMSStore(selectDominantSpeaker);
  return dominantSpeaker && dominantSpeaker.name ? (
    <Flex
      align="center"
      justify="center"
      css={{ flex: '1 1 0', color: '$on_primary_high', '@md': { display: 'none' } }}
    >
      <VolumeOneIcon />
      <Text variant="md" css={{ ...textEllipsis(200), ml: '$2' }} title={dominantSpeaker.name}>
        {dominantSpeaker.name}
      </Text>
    </Flex>
  ) : (
    <></>
  );
};

const LogoImg = styled('img', {
  maxHeight: '$14',
  p: '$2',
  w: 'auto',
  '@md': {
    maxHeight: '$12',
  },
});

export const Logo = () => {
  const roomLayout = useRoomLayout();
  const logo = roomLayout?.logo?.url;
  const isMobile = useMedia(cssConfig.media.md);
  const isConnected = useHMSStore(selectIsConnectedToRoom);
  // Hide logo for now as there is not enough space
  if (isConnected && isMobile && isStreamingKit()) {
    return null;
  }
  return logo ? <LogoImg src={logo} alt="Brand Logo" width={40} height={40} /> : null;
};
