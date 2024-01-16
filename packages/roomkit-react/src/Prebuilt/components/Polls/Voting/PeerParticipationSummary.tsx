import React from 'react';
import { HMSPoll, selectLocalPeerID, useHMSStore } from '@100mslive/react-sdk';
import { Box } from '../../../../Layout';
import { Text } from '../../../../Text';
import { StatisticBox } from './StatisticBox';
import { useQuizSummary } from './useQuizSummary';

export const PeerParticipationSummary = ({ quiz }: { quiz: HMSPoll }) => {
  const localPeerId = useHMSStore(selectLocalPeerID);
  const { quizLeaderboard, summary } = useQuizSummary(quiz.id);
  if (quiz.state !== 'stopped') {
    return <></>;
  }
  const isLocalPeerQuizCreator = localPeerId === quiz.startedBy;
  const peerEntry = quizLeaderboard?.entries.find(entry => entry.peer?.peerid === localPeerId);

  const boxes = isLocalPeerQuizCreator
    ? [
        {
          title: 'Voted',
          value: `${summary.totalUsers ? ((100 * summary.votedUsers) / summary.totalUsers).toFixed(2) : 0}% (${
            summary.votedUsers
          }/${summary.totalUsers})`,
        },
        { title: 'Correct Answers', value: summary.correctAnswers },
        { title: 'Avg. Time Taken', value: summary.avgTime },
        { title: 'Avg. Score', value: summary.avgScore },
      ]
    : [
        { title: 'Your rank', value: peerEntry?.position },
        { title: 'Points', value: peerEntry?.score },
        { title: 'Time Taken', value: peerEntry?.duration },
        { title: 'Correct Answers', value: `${peerEntry?.correctResponses}/${peerEntry?.totalResponses}` },
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
