import * as BaseSlider from '@radix-ui/react-slider';
import React from 'react';
import { styled } from '../stitches.config';

const Root = styled(BaseSlider.Root, {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    userSelect: 'none',
    touchAction: 'none',
    width: '100%',
    marginTop: '1rem',
    marginBottom: '1.5rem',
    '&[data-orientation="horizontal"]': {
        height: 20
    }
});

const Track = styled(BaseSlider.Track, {
    backgroundColor: '$gray3',
    position: 'relative',
    flexGrow: 1,
    borderRadius: '$round',
    '&[data-orientation="horizontal"]': { height: 3 }
});

const Range = styled(BaseSlider.Range, {
    position: 'absolute',
    backgroundColor: 'white',
    borderRadius: '$round',
    height: '100%'
});

const Thumb = styled(BaseSlider.Thumb, {
    all: 'unset',
    display: 'block',
    width: 15,
    height: 15,
    backgroundColor: 'white',
    boxShadow: `0 2px 10px $colors$gray4`,
    borderRadius: 10,
    '&:hover': { backgroundColor: '$gray9' },
    '&:focus': { boxShadow: `0 0 0 5px $colors$gray2` }
});

type SliderProps = React.ComponentProps<typeof Root>;

export const Slider: React.FC<SliderProps> = (props) => (
    <Root {...props}>
        <Track>
            <Range />
        </Track>
        <Thumb />
    </Root>
);

Slider.displayName = 'Switch';
