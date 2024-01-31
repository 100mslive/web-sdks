import React from 'react';
import { Flex, Text } from '../../../../';

const statusMap: Record<string, string> = {
  created: 'DRAFT',
  started: 'LIVE',
  stopped: 'ENDED',
};

export const StatusIndicator = ({ status }: { status?: string }) => {
  if (!status) return null;
  return (
    <Flex align="center">
      <Flex
        css={{
          backgroundColor: status === 'started' ? '$alert_error_default' : '$secondary_default',
          p: '$2 $4',
          borderRadius: '$0',
        }}
      >
        <Text
          variant="caption"
          css={{
            fontWeight: '$semiBold',
            color: '$on_primary_high',
          }}
        >
          {statusMap[status]}
        </Text>
      </Flex>
    </Flex>
  );
};
