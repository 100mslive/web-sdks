import React from 'react';
import { Flex } from '../../../Layout';
import { Text } from '../../../Text';
import { styled } from '../../../Theme';

const ActionTileRoot = ({ active, disabled = false, children, onClick, ...props }) => (
  <Flex
    {...props}
    css={{
      flexDirection: 'column',
      alignItems: 'center',
      p: '$4 $2',
      position: 'relative',
      bg: active ? '$surface_bright' : '',
      color: disabled ? '$on_surface_low' : '$on_surface_high',
      gap: '4',
      r: '1',
      '&:hover': {
        bg: 'surface.bright',
      },
    }}
    onClick={() => {
      if (!disabled) {
        onClick();
      }
    }}
  >
    {children}
  </Flex>
);

const ActionTileCount = styled(Text, {
  position: 'absolute',
  top: 0,
  right: 0,
  fontWeight: '$semiBold',
  color: 'onSurface.high',
  p: '$1 $2',
  minWidth: '9',
  textAlign: 'center',
  boxSizing: 'border-box',
  bg: 'surface.bright',
  r: 'round',
  letterSpacing: '1.5px',
  fontSize: '$tiny !important',
  lineHeight: '$tiny !important',
});

const ActionTileTitle = styled(Text, {
  fontWeight: '$semiBold',
  color: 'inherit',
  textAlign: 'center',
  fontSize: '$xs !important',
});

export const ActionTile = {
  Root: ActionTileRoot,
  Title: ActionTileTitle,
  Count: ActionTileCount,
};
