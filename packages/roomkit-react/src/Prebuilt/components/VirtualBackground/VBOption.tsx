import React from 'react';
import { Box, Flex } from '../../../Layout';
import { Text } from '../../../Text';

const Root = ({
  onClick,
  mediaURL,
  isActive,
  children,
  testid = '',
}: {
  onClick?: () => Promise<void>;
  mediaURL?: string;
  isActive: boolean;
  children?: React.JSX.Element[];
  testid: string;
}) => (
  <Flex
    data-testid={testid}
    direction="column"
    align="center"
    css={{
      p: '5',
      borderRadius: '1',
      bg: 'surface.bright',
      border: `4px solid ${isActive ? '$primary_default' : '$surface_dim'}`,
      cursor: 'pointer',
      '@media (hover:hover)': {
        '&:hover': { border: '4px solid $primary_dim' },
      },
      ...(mediaURL ? { height: '20', backgroundImage: `url("${mediaURL}")`, backgroundSize: 'cover' } : {}),
    }}
    onClick={async () => {
      await onClick?.();
    }}
  >
    {children}
  </Flex>
);

const Title = ({ children }: { children?: string }) => {
  return children ? (
    <Text variant="xs" css={{ color: 'onSurface.medium' }}>
      {children}
    </Text>
  ) : null;
};

const Icon = ({ children }: { children?: React.JSX.Element }) => {
  return children ? <Box css={{ color: 'onSurface.high' }}>{children}</Box> : null;
};

export const VBOption = {
  Root,
  Title,
  Icon,
};
