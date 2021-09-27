import { styled } from '@stitches/react';
import React from 'react';

export interface AvatarProps {
    name: string;
}

const AvatarRoot = styled('div', {
    color: 'red',
    width: '100px',
    height: '100px'
});

export const Avatar: React.FC<AvatarProps> = ({ name }) => <AvatarRoot>{name}</AvatarRoot>;
