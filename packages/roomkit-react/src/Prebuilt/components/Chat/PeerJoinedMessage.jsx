import React from 'react';
import { PeopleAddIcon } from '@100mslive/react-icons';
import { Flex } from '../../../Layout';
import { Text } from '../../../Text';

export const PeerJoinedMessage = ({ content }) => {
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
      <PeopleAddIcon />
      <Text variant="xs" css={{ c: '$on_surface_high', fontWeight: '$semiBold' }}>
        {content}
      </Text>
    </Flex>
  );
};
