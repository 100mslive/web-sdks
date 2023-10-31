import React from 'react';
import { Box, Flex } from '../../../Layout';
import { Text } from '../../../Text';

const Root = ({
  onClick,
  mediaURL,
  isActive,
  type,
  children,
}: {
  onClick?: () => Promise<void>;
  mediaURL?: string;
  isActive: boolean;
  type: string;
  children?: React.JSX.Element[];
}) => (
  <Flex
    direction="column"
    align="center"
    css={{
      p: '$5',
      borderRadius: '$1',
      bg: '$surface_bright',
      border: `2px solid ${isActive ? '$primary_default' : '$surface_dim'}`,
      cursor: 'pointer',
      '&:hover': { border: '2px solid $primary_dim' },
      ...(mediaURL ? { height: '$20', backgroundImage: `url(${mediaURL})`, backgroundSize: 'cover' } : {}),
    }}
    onClick={async () => {
      if (onClick) {
        console.log(type);
        await onClick();
      }
    }}
  >
    {children}
  </Flex>
);

const Title = ({ children }: { children?: string }) => (
  <Text variant="xs" css={{ color: '$on_surface_medium' }}>
    {children}
  </Text>
);

const Icon = ({ children }: { children?: React.JSX.Element }) => (
  <Box css={{ color: '$on_surface_high' }}>{children}</Box>
);

export const VBOption = {
  Root,
  Title,
  Icon,
};
