import * as BaseSlider from '@radix-ui/react-slider';
import React from 'react';
import { Tooltip } from '../Tooltip';
import { styled } from '../Theme';

const Root = styled(BaseSlider.Root, {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  userSelect: 'none',
  touchAction: 'none',
  width: '100%',
  '&[data-orientation="horizontal"]': {
    height: 20,
  },
});

const Track = styled(BaseSlider.Track, {
  backgroundColor: '$brandLight',
  position: 'relative',
  flexGrow: 1,
  borderRadius: '$round',
  cursor: 'pointer',
  '&[data-orientation="horizontal"]': { height: 3 },
});

const Range = styled(BaseSlider.Range, {
  position: 'absolute',
  backgroundColor: '$brandDefault',
  borderRadius: '$round',
  height: '100%',
});

const Thumb = styled(BaseSlider.Thumb, {
  all: 'unset',
  display: 'block',
  width: 15,
  height: 15,
  backgroundColor: '$brandDefault',
  cursor: 'pointer',
  boxShadow: `0 2px 10px $colors$grayDefault`,
  borderRadius: 10,
  '&:hover': { backgroundColor: '$brandDefault' },
  '&:focus': { boxShadow: 'none' },
});

type SliderProps = React.ComponentProps<typeof Root>;

export const Slider: React.FC<SliderProps> = props => (
  <Root {...props}>
    <Track>
      <Range />
    </Track>
    <Tooltip title={String(props.value?.[0])}>
      <Thumb />
    </Tooltip>
  </Root>
);

Slider.displayName = 'Slider';
