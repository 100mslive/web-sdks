import { ReactNode } from 'react';
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
  children?: ReactNode[];
  testid: string;
}) => (
  <Flex
    data-testid={testid}
    direction="column"
    align="center"
    css={{
      p: '$5',
      borderRadius: '$1',
      bg: '$surface_bright',
      border: `4px solid ${isActive ? '$primary_default' : '$surface_dim'}`,
      cursor: 'pointer',
      '@media (hover:hover)': {
        '&:hover': { border: '4px solid $primary_dim' },
      },
      ...(mediaURL ? { height: '$20', backgroundImage: `url("${mediaURL}")`, backgroundSize: 'cover' } : {}),
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
    <Text variant="xs" css={{ color: '$on_surface_medium' }}>
      {children}
    </Text>
  ) : null;
};

const Icon = ({ children }: { children?: ReactNode }) => {
  return children ? <Box css={{ color: '$on_surface_high' }}>{children}</Box> : null;
};

export const VBOption = {
  Root,
  Title,
  Icon,
};
