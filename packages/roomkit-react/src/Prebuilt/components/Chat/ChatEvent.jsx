import React from 'react';
import { Flex } from '../../../Layout';
import { Text } from '../../../Text';

export const ChatEvent = ({ icon, content }) => {
  return (
    <Flex
      align="center"
      justify="center"
      css={{
        bg: '$surface_default',
        p: '$2 $4',
        r: '$1',
        mx: 'auto',
        c: '$on_surface_low',
        w: 'fit-content',
        gap: '$4',
        mt: '$8',
      }}
    >
      {icon}
      <Text variant="xs" css={{ c: '$on_surface_high', fontWeight: '$semiBold' }}>
        {content}
      </Text>
    </Flex>
  );
};
