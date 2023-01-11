import React, { ComponentProps } from 'react';
import * as icons from '@100mslive/react-icons';
import { styled } from '@stitches/react';
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
        color: '#F5F9FFF2',
        '&:hover': {
          color: '#E0ECFFCC',
        },
      },
      primary: {
        color: '#66A1FF',
        '&:hover': {
          color: '#2672ED',
        },
      },
    },
  },
});

export const Link = ({
  iconSide = 'left',
  icon,
  color = 'primary',
  children,
  ...rest
}: Omit<ComponentProps<'a'>, 'ref'> & {
  iconSide?: 'left' | 'right';
  icon?: keyof typeof icons;
  color?: 'highEmp' | 'primary';
}) => {
  const Icon = icon ? icons[icon] : React.Fragment;
  const renderedIcon = (
    <Flex as="span">
      <Icon style={{ height: '13.33px', width: '13.33px' }} />{' '}
    </Flex>
  );

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
