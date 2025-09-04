import React from 'react';
import * as BaseSlider from '@radix-ui/react-slider';
import { styled } from '../styled-system';
import { Tooltip } from '../Tooltip';

const Root = styled(BaseSlider.Root, {
  base: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    userSelect: 'none',
    touchAction: 'none',
    width: '100%',
    '&[data-orientation="horizontal"]': {
      height: '20px',
    },
  },
});

const Track = styled(BaseSlider.Track, {
  base: {
    backgroundColor: 'surface.bright',
    position: 'relative',
    flexGrow: '1',
    borderRadius: 'token(radii.round)',
    cursor: 'pointer',
    '&[data-orientation="horizontal"]': {
      height: '3px',
    },
  },
});

const Range = styled(BaseSlider.Range, {
  base: {
    position: 'absolute',
    backgroundColor: 'primary.default',
    borderRadius: 'token(radii.round)',
    height: '100%',
  },
});

const Thumb = styled(BaseSlider.Thumb, {
  base: {
    all: 'unset',
    display: 'block',
    width: 'token(spacing.8)',
    height: 'token(spacing.8)',
    backgroundColor: 'primary.default',
    cursor: 'pointer',
    boxShadow: '0 2px 10px token(colors.surface.default)',
    borderRadius: '10px',
    '&:hover': {
      backgroundColor: 'primary.default',
    },
    '&:focus': {
      boxShadow: 'none',
    },
  },
});

type SliderProps = React.ComponentProps<typeof Root> & {
  thumbStyles?: Record<string, any>;
  showTooltip?: boolean;
};

export const Slider: React.FC<SliderProps & { showTooltip?: boolean }> = ({
  showTooltip = true,
  thumbStyles,
  ...props
}) => {
  const values = props.value || props.defaultValue || [0];
  return (
    <Root {...props}>
      <Track>
        <Range />
      </Track>
      {values.map((_: any, index: number) =>
        showTooltip ? (
          <Tooltip key={index} title={String(values[index])}>
            <Thumb style={thumbStyles} />
          </Tooltip>
        ) : (
          <Thumb key={index} style={thumbStyles} />
        ),
      )}
    </Root>
  );
};
