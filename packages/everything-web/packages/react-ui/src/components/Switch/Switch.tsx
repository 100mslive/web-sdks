import { styled } from '../../../stitches.config';
import * as BaseSwitch from '@radix-ui/react-switch';

const SwitchRoot = styled(BaseSwitch.Root, {
    all: 'unset',
    width: 34,
    height: 14,
    backgroundColor: '$grey3',
    borderRadius: '9999px',
    position: 'relative',
    '&[data-state="checked"]': { backgroundColor: '$brandTint' },
    '&:focus': {
        outline: 'none'
    }
});

const SwitchThumb = styled(BaseSwitch.Thumb, {
    display: 'block',
    position: 'absolute',
    top: -3,
    left: -3,
    width: 20,
    height: 20,
    backgroundColor: '$grey4',
    borderRadius: '9999px',
    transition: 'transform 100ms',
    transform: 'translateX(2px)',
    willChange: 'transform',
    '&[data-state="checked"]': { transform: 'translateX(18px)', backgroundColor: '$brandMain' }
});

export type SwitchComponentType = {
    Root: typeof SwitchRoot;
    Thumb: typeof SwitchThumb;
};

export const Switch: SwitchComponentType = {
    Root: SwitchRoot,
    Thumb: SwitchThumb
};
