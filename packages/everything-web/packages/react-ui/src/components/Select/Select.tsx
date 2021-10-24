import { styled } from '../../../stitches.config';
import React from 'react';
import { ChevronDownIcon } from '@100mslive/react-icons';

const Root = styled('div', {
    color: 'white',
    display: 'inline-flex',
    position: 'relative',
    height: '40px',
    width: '300px',
    minWidth: '160px',
    outline: 'none',
    overflow: 'hidden',
    borderRadius: '8px',
    backgroundColor: '$grey2'
});

const SelectRoot = styled('select', {
    fontSize: '16px',
    fontWeight: '500',
    appearance: 'none',
    color: '#fff',
    width: '100%',
    paddingLeft: '12px',
    paddingRight: '30px',
    border: 'none',
    borderRadius: '8px',
    backgroundColor: 'transparent',
    '&:focus': {
        outline: 'none',
        boxShadow: '0 0 0 3px $colors$brandTint'
    }
});

const Arrow = styled('span', {
    color: '$grey4',
    width: '30px',
    height: '100%',
    position: 'absolute',
    right: 0,
    pointerVvents: 'none',
    display: 'flex',
    alignItems: 'center',
    transition: 'border .2s ease 0s'
});

export const Select: React.FC = ({ children, props }: any) => {
    return (
        <Root>
            <Arrow>
                <ChevronDownIcon />
            </Arrow>
            <SelectRoot {...props}>{children}</SelectRoot>
        </Root>
    );
};
