import { ComponentProps, ElementType, Fragment } from 'react';
import * as icons from '@100mslive/react-icons';
import { Flex } from '../Layout';
import { Text } from '../Text';
import { styled } from '../Theme';

const LinkComponent = styled('a', {
  textDecoration: 'none',
  display: 'flex',
  alignItems: 'center',
  gap: '$5',
  variants: {
    color: {
      highEmp: {
        color: '$on_surface_high',
        '&:hover': {
          color: '$on_surface_medium',
        },
      },
      primary: {
        color: '$primary_default',
        '&:hover': {
          color: '$primary_bright',
        },
      },
    },
  },
});

export interface LinkProps extends ComponentProps<typeof LinkComponent> {
  as?: ElementType;
  iconSide?: 'left' | 'right' | 'none';
  icon?: keyof typeof icons;
  color?: 'highEmp' | 'primary';
}

export const Link = ({ iconSide = 'left', icon, color = 'primary', children, ...rest }: LinkProps) => {
  const Icon = icon ? icons[icon] : Fragment;
  const renderedIcon = icon ? (
    <Flex as="span">
      <Icon height={13.33} width={13.33} />{' '}
    </Flex>
  ) : null;

  return (
    <LinkComponent {...rest} color={color}>
      {iconSide === 'left' && renderedIcon}
      <Text as="span" variant="body2" css={{ color: 'inherit' }}>
        {children}
      </Text>
      {iconSide === 'right' && renderedIcon}
    </LinkComponent>
  );
};
