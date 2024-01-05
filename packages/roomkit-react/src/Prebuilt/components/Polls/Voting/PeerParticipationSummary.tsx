import React from 'react';
import { HMSPoll, selectLocalPeer, useHMSStore } from '@100mslive/react-sdk';
import { Box } from '../../../../Layout';
import { Text } from '../../../../Text';
import { StatisticBox } from './StatisticBox';
// @ts-ignore
import { getPeerParticipationSummary } from '../../../common/utils';

export const PeerParticipationSummary = ({ poll }: { poll: HMSPoll }) => {
  const localPeer = useHMSStore(selectLocalPeer);
  const { totalResponses, correctResponses, score } = getPeerParticipationSummary(
    poll,
    localPeer?.id,
    localPeer?.customerUserId,
  );

  const boxes = [
    { title: 'Points', value: score },
    { title: 'Correct Answers', value: `${correctResponses}/${totalResponses}` },
  ];
  return (
    <Box>
      <Text css={{ fontWeight: '$semiBold', my: '$8' }}>Participation Summary</Text>
      <Box css={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '$4' }}>
        {boxes.map(box => (
          <StatisticBox key={box.title} title={box.title} value={box.value} />
        ))}
      </Box>
    </Box>
  );
};
