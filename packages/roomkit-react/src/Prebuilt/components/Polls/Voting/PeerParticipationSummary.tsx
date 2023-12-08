import React from 'react';
import { HMSPoll, selectLocalPeerID, useHMSStore } from '@100mslive/react-sdk';
import { Box } from '../../../../Layout';
import { Text } from '../../../../Text';
// @ts-ignore
import { getPeerParticipationSummary } from '../../../common/utils';

export const PeerParticipationSummary = ({ poll }: { poll: HMSPoll }) => {
  const localPeerID = useHMSStore(selectLocalPeerID);
  const { totalResponses, correctResponses, score } = getPeerParticipationSummary(poll, localPeerID);

  const boxes = [
    { title: 'Points', value: score },
    { title: 'Correct Answers', value: `${correctResponses}/${totalResponses}` },
  ];
  return (
    <Box>
      <Text css={{ fontWeight: '$semiBold', my: '$8' }}>Participation Summary</Text>
      <Box css={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '$4' }}>
        {boxes.map(box => (
          <Box key={box.title} css={{ p: '$8', background: '$surface_default', borderRadius: '$1' }}>
            <Text
              variant="tiny"
              css={{ textTransform: 'uppercase', color: '$on_surface_medium', fontWeight: '$semiBold', my: '$4' }}
            >
              {box.title}
            </Text>
            <Text css={{ fontWeight: '$semiBold' }}>{box.value}</Text>
          </Box>
        ))}
      </Box>
    </Box>
  );
};
