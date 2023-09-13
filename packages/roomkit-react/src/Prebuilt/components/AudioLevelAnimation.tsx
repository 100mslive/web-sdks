import React, { useEffect, useRef } from 'react';
import { selectTrackAudioByID, useHMSVanillaStore } from '@100mslive/react-sdk';
import { Box, Flex } from '../../Layout';
import { keyframes } from '../../Theme';
//@ts-ignore
import bg from '../images/audio-level.png';

// keep the calculated values before hand to avoid recalcuation everytime
const positionValues = new Array(101).fill(0).reduce((acc, _, index) => {
  acc[index] = Math.round((index / 100) * 4) / 4; // convert to 0.25 multiples
  return acc;
}, {});

const barAnimation = keyframes({
  from: {
    maskSize: '4em .8em',
    '-webkit-mask-position-y': '.1em',
  },

  '50%': {
    maskSize: '4em 1em',
    '-webkit-mask-position-y': 0,
  },

  to: {
    maskSize: '4em .8em',
    '-webkit-mask-position-y': '.1em',
  },
});

const AudioBar = () => {
  return (
    <Box
      css={{
        width: '.25em',
        height: '1em',
        maskImage: `url(${bg})`,
        maskRepeat: 'no-repeat',
        backgroundColor: '$on_primary_high',
        maskSize: '4em 1em',
        animation: `${barAnimation} .6s steps(3,jump-none) 0s infinite`,
        maskPositionX: 0,
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
          child.style['-webkit-mask-position-x'] = `-${positionValues[audioLevel] * (index === 1 ? 2.5 : 1.25)}em`;
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
