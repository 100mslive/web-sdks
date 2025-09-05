import React, { useEffect, useState } from 'react';
import { selectDominantSpeaker, useHMSStore } from '@100mslive/react-sdk';
import { VolumeOneIcon } from '@100mslive/react-icons';
import { Flex, styled, Text, textEllipsis } from '../../../';
import { useRoomLayout } from '../../provider/roomLayoutProvider';

export const SpeakerTag = () => {
  const dominantSpeaker = useHMSStore(selectDominantSpeaker);
  return (
    dominantSpeaker &&
    dominantSpeaker.name && (
      <Flex
        align="center"
        justify="center"
        css={{ flex: '1 1 0', color: 'onSurface.high', '@md': { display: 'none' } }}
      >
        <VolumeOneIcon />
        <Text variant="sm" css={{ ...textEllipsis(200), ml: '2' }} title={dominantSpeaker.name}>
          {dominantSpeaker.name}
        </Text>
      </Flex>
    )
  );
};

const LogoImg = styled('img', {
  maxHeight: '14',
  w: 'auto',
  objectFit: 'contain',
  '@md': {
    maxHeight: '12',
  },
});

export const Logo = () => {
  const roomLayout = useRoomLayout();
  const logo = roomLayout?.logo?.url;
  const [hideImage, setHideImage] = useState(false);
  // Hide logo for now as there is not enough space
  useEffect(() => {
    if (hideImage) {
      setHideImage(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logo]);

  return logo && !hideImage ? (
    <LogoImg
      src={logo}
      alt="Brand Logo"
      onError={e => {
        e.target.onerror = null;
        setHideImage(true);
      }}
    />
  ) : null;
};
