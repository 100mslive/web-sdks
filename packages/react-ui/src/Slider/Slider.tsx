import React from 'react';
import { CSS } from '@stitches/react';
import * as BaseSlider from '@radix-ui/react-slider';
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
  backgroundColor: '$grayDefault',
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
  width: '$8',
  height: '$8',
  backgroundColor: '$brandDefault',
  cursor: 'pointer',
  boxShadow: `0 2px 10px $colors$grayDefault`,
  borderRadius: 10,
  '&:hover': { backgroundColor: '$brandDefault' },
  '&:focus': { boxShadow: 'none' },
});

type SliderProps = React.ComponentProps<typeof Root> & { thumbStyles?: CSS };

export const Slider: React.FC<SliderProps> = ({
  showTooltip = true,
  thumbStyles,
  ...props
}) => (
  <Root {...props}>
    <Track>
      <Range />
    </Track>
    <Tooltip title={showTooltip ? String(props.value?.[0]) : null}>
      <Thumb css={thumbStyles} />
    </Tooltip>
  </Root>
);

Slider.displayName = 'Slider';
