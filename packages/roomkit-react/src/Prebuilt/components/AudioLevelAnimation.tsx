import React, { useEffect, useRef } from 'react';
import { selectTrackAudioByID, useHMSVanillaStore } from '@100mslive/react-sdk';
import { Box, Flex } from '../../Layout';
import { keyframes } from '../../Theme';
//@ts-ignore
import bg from '../images/audio-level.png';

function getPosition(base: number, audioLevel: number) {
  return base * (Math.round((audioLevel / 100) * 4) / 4);
}

const barAnimation = keyframes({
  from: {
    backgroundSize: '4em .8em',
    backgroundPositionY: '.1em',
  },

  '50%': {
    backgroundSize: '4em 1em',
    backgroundPositionY: 0,
  },

  to: {
    backgroundSize: '4em .8em',
    backgroundPositionY: '.1em',
  },
});

const AudioBar = () => {
  return (
    <Box
      css={{
        width: '.25em',
        height: '1em',
        background: `url(${bg})`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: '4em 1em',
        animation: `${barAnimation} .6s steps(3,jump-none) 0s infinite`,
        backgroundPositionX: 0,
      }}
    />
  );
};

export const AudioLevelAnimation = ({ trackId }: { trackId?: string }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const vanillaStore = useHMSVanillaStore();

  useEffect(() => {
    const unsubscribe = vanillaStore.subscribe(audioLevel => {
      if (ref.current) {
        let index = 0;
        //@ts-ignore
        for (const child of ref.current.children) {
          child.style['background-position-x'] = `-${getPosition(index === 1 ? 2.5 : 1.25, audioLevel)}em`;
          index++;
        }
      }
    }, selectTrackAudioByID(trackId));
    return unsubscribe;
  }, [vanillaStore, trackId]);
  return (
    <Flex ref={ref} css={{ fontSize: '1rem', gap: '$2' }}>
      <AudioBar />
      <AudioBar />
      <AudioBar />
    </Flex>
  );
};
