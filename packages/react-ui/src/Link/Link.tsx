import React from 'react';
import * as icons from '@100mslive/react-icons';
import { styled } from '../Theme';
import { Text } from '../Text';
import { Flex } from '../Layout';

const LinkComponent = styled('a', {
  textDecoration: 'none',
  display: 'flex',
  alignItems: 'center',
  gap: '11.3px',
  variants: {
    color: {
      highEmp: {
        color: '$textHighEmp',
        '&:hover': {
          color: '$textMedEmp',
        },
      },
      primary: {
        color: '$primaryLight',
        '&:hover': {
          color: '$primaryDefault',
        },
      },
      error: {
        color: '$errorTint',
        '&:hover': {
          color: '$errorDark',
        },
      },
    },
  },
});

export interface LinkProps extends React.ComponentProps<typeof LinkComponent> {
  as?: React.ElementType;
  iconSide?: 'left' | 'right';
  icon?: keyof typeof icons;
  color?: 'highEmp' | 'primary' | 'error';
}

export const Link = ({ iconSide = 'left', icon, color = 'primary', children, ...rest }: LinkProps) => {
  const Icon = icon ? icons[icon] : React.Fragment;
  const renderedIcon = icon ? (
    <Flex as="span">
      <Icon style={{ height: '13.33px', width: '13.33px' }} />{' '}
    </Flex>
  ) : null;

  const showLeft = iconSide === 'left';
  return (
    <LinkComponent {...rest} color={color}>
      {showLeft && renderedIcon}
      <Text as="span" variant="body2" css={{ color: 'inherit' }}>
        {children}
      </Text>
      {!showLeft && renderedIcon}
    </LinkComponent>
  );
};
