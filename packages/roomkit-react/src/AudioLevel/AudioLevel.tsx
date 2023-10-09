import React, { useEffect, useRef } from 'react';
import { selectTrackAudioByID, useHMSVanillaStore } from '@100mslive/react-sdk';
import { Box, Flex } from '../Layout';
import { keyframes } from '../Theme';
//@ts-ignore
import bg from './audio-level.png';

// keep the calculated values before hand to avoid recalcuation everytime
const positionValues = new Array(101).fill(0).reduce((acc, _, index) => {
  acc[index] = Math.round((index / 100) * 4) / 4; // convert to 0.25 multiples
  return acc;
}, {});

const barAnimation = keyframes({
  from: {
    maskSize: '4em .8em',
    '-webkit-mask-position-y': '.1em',
    maskPosition: 'initial .1em',
  },

  '50%': {
    maskSize: '4em 1em',
    '-webkit-mask-position-y': 0,
    maskPosition: 'initial 0',
  },

  to: {
    maskSize: '4em .8em',
    '-webkit-mask-position-y': '.1em',
    maskPosition: 'initial 0.1em',
  },
});

const AudioBar = () => {
  return (
    <Box
      css={{
        width: '.25em',
        height: '1em',
        maskImage: `url(${bg})`,
        '-webkit-mask-repeat': 'no-repeat',
        backgroundColor: '$on_primary_high',
        maskSize: '4em 1em',
      }}
    />
  );
};

export const AudioLevel = ({ trackId, size }: { trackId?: string; size?: 'small' | 'medium' }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const vanillaStore = useHMSVanillaStore();

  useEffect(() => {
    const unsubscribe = vanillaStore.subscribe(audioLevel => {
      if (ref.current) {
        let index = 0;
        //@ts-ignore
        for (const child of ref.current.children) {
          const positionX = `-${positionValues[audioLevel] * (index === 1 ? 2.5 : 1.25)}em`;
          child.style['-webkit-mask-position-x'] = positionX;
          child.style['mask-position'] = `${positionX} 0`;
          child.style['animation'] =
            positionValues[audioLevel] > 0 ? `${barAnimation} 0.6s steps(3,jump-none) 0s infinite` : 'none';
          index++;
        }
      }
    }, selectTrackAudioByID(trackId));
    return unsubscribe;
  }, [vanillaStore, trackId]);
  return (
    <Flex
      ref={ref}
      css={{
        fontSize: size === 'small' ? '0.75rem' : '1rem',
        gap: size === 'small' ? '$1' : '$2',
      }}
    >
      <AudioBar />
      <AudioBar />
      <AudioBar />
    </Flex>
  );
};
