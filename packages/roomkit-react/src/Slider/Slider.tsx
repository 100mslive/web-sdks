import { ComponentProps, FC } from 'react';
import { CSS } from '@stitches/react';
import { Slider as BaseSlider } from 'radix-ui';
import { styled } from '../Theme';
import { Tooltip } from '../Tooltip';

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
  backgroundColor: '$surface_bright',
  position: 'relative',
  flexGrow: 1,
  borderRadius: '$round',
  cursor: 'pointer',
  '&[data-orientation="horizontal"]': { height: 3 },
});

const Range = styled(BaseSlider.Range, {
  position: 'absolute',
  backgroundColor: '$primary_default',
  borderRadius: '$round',
  height: '100%',
});

const Thumb = styled(BaseSlider.Thumb, {
  all: 'unset',
  display: 'block',
  width: '$8',
  height: '$8',
  backgroundColor: '$primary_default',
  cursor: 'pointer',
  boxShadow: `0 2px 10px $colors$surface_default`,
  borderRadius: 10,
  '&:hover': { backgroundColor: '$primary_default' },
  '&:focus': { boxShadow: 'none' },
});

type SliderProps = ComponentProps<typeof Root> & {
  thumbStyles?: CSS;
  showTooltip?: boolean;
};

export const Slider: FC<SliderProps & { showTooltip?: boolean }> = ({ showTooltip = true, thumbStyles, ...props }) => (
  <Root {...props}>
    <Track>
      <Range />
    </Track>
    {showTooltip ? (
      <Tooltip title={String(props.value?.[0])}>
        <Thumb css={thumbStyles} />
      </Tooltip>
    ) : (
      <Thumb css={thumbStyles} />
    )}
  </Root>
);
