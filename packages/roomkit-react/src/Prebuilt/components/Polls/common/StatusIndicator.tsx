import React from 'react';
import { HMSPollStates } from '@100mslive/react-sdk';
import { Flex, Text } from '../../../../';
import { PollStage } from './constants';

const statusMap: Record<HMSPollStates, PollStage> = {
  created: PollStage.DRAFT,
  started: PollStage.LIVE,
  stopped: PollStage.ENDED,
};

export const StatusIndicator = ({ status }: { status?: HMSPollStates }) => {
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
