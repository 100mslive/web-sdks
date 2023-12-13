// @ts-check
import React from 'react';
import { Flex, Text } from '../../../../';

export const StatusIndicator = ({ isLive }) => {
  return (
    <Flex align="center">
      <Flex
        css={{
          backgroundColor: isLive ? '$alert_error_default' : '$secondary_default',
          p: '$2 $4',
          borderRadius: '$0',
        }}
      >
        <Text
          variant="caption"
          css={{
            fontWeight: '$semiBold',
            color: '$on_surface_high',
          }}
        >
          {isLive ? 'LIVE' : 'ENDED'}
        </Text>
      </Flex>
    </Flex>
  );
};
