import { styled } from '../../../stitches.config';
import * as BaseSlider from '@radix-ui/react-slider';

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
    backgroundColor: '$grey3',
    position: 'relative',
    flexGrow: 1,
    borderRadius: '9999px',
    '&[data-orientation="horizontal"]': { height: 3 }
});

const Range = styled(BaseSlider.Range, {
    position: 'absolute',
    backgroundColor: 'white',
    borderRadius: '9999px',
    height: '100%'
});

const Thumb = styled(BaseSlider.Thumb, {
    all: 'unset',
    display: 'block',
    width: 15,
    height: 15,
    backgroundColor: 'white',
    boxShadow: `0 2px 10px $colors$grey4`,
    borderRadius: 10,
    '&:hover': { backgroundColor: '$grey5' },
    '&:focus': { boxShadow: `0 0 0 5px $colors$grey2` }
});

export type SliderComponentType = {
    Root: typeof Root;
    Track: typeof Track;
    Range: typeof Range;
    Thumb: typeof Thumb;
};

export const Slider: SliderComponentType = {
    Root,
    Track,
    Range,
    Thumb
};
