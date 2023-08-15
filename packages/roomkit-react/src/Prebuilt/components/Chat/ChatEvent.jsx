import React from 'react';
import { Flex } from '../../../Layout';
import { Text } from '../../../Text';

export const ChatEvent = ({ icon, content }) => {
  return (
    <Flex
      align="center"
      css={{
        bg: '$surface_default',
        p: '$2 $4',
        r: '$1',
        mx: 'auto',
        maxWidth: '100%',
        c: '$on_surface_low',
        gap: '$4',
      }}
    >
      {icon}
      <Text variant="xs" css={{ c: '$on_surface_high', fontWeight: '$semiBold' }}>
        {content}
      </Text>
    </Flex>
  );
};
