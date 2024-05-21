import React from 'react';
import { Box, Flex } from '../../Layout';
import { Text } from '../../Text';

export const WaitingView = React.memo(
  ({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) => {
    return (
      <Flex
        align="center"
        direction="column"
        css={{
          textAlign: 'center',
          margin: 'auto',
          h: '100%',
          justifyContent: 'center',
          gap: '$8',
        }}
      >
        <Box
          css={{
            backgroundColor: '$surface_default',
            display: 'flex',
            alignItems: 'center',
            gap: '$4',
            size: '$20',
            r: '$round',
            justifyContent: 'center',
          }}
        >
          {icon}
        </Box>
        <Flex
          direction="column"
          css={{
            p: '$1',
            gap: '$4',
          }}
        >
          <Text variant="h4" css={{ '@md': { fontSize: '$md', color: '$on_surface_high' } }}>
            {title}
          </Text>
          <Text
            variant="body1"
            css={{ fontWeight: '$regular', color: '$on_surface_medium', '@md': { fontSize: '$sm' } }}
          >
            {subtitle}
          </Text>
        </Flex>
      </Flex>
    );
  },
);
