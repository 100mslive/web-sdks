import { HMSPollState } from '@100mslive/react-sdk';
import { Flex, Text } from '../../../../';
import { PollStage } from './constants';

const statusMap: Record<HMSPollState, PollStage> = {
  created: PollStage.DRAFT,
  started: PollStage.LIVE,
  stopped: PollStage.ENDED,
};

export const StatusIndicator = ({ status }: { status?: HMSPollState }) => {
  if (!status) return null;
  return (
    <Flex align="center">
      <Flex
        css={{
          backgroundColor: statusMap[status] === PollStage.LIVE ? '$alert_error_default' : '$secondary_default',
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
