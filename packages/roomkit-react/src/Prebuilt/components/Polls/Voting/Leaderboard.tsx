import React, { useEffect, useState } from 'react';
// import { HMSLeaderboardEntry, HMSPollLeaderboardResponse } from '@100mslive/hms-video';
import { selectPollByID, useHMSActions, useHMSStore } from '@100mslive/react-sdk';
import { ChevronLeftIcon, CrossIcon } from '@100mslive/react-icons';
// import { CheckCircleIcon, TrophyFilledIcon } from '@100mslive/react-icons';
import { Box, Flex } from '../../../../Layout';
import { Loading } from '../../../../Loading';
import { Text } from '../../../../Text';
// @ts-ignore
import { useSidepaneToggle } from '../../AppData/useSidepane';
// @ts-ignore
import { usePollViewState } from '../../AppData/useUISettings';
// @ts-ignore
import { StatusIndicator } from '../common/StatusIndicator';
import { POLL_VIEWS } from '../../../common/constants';

// const LeaderboardEntry = ({
//   position,
//   score,
//   totalResponses,
//   correctResponses,
//   userName,
// }: {
//   position: number;
//   score: number;
//   totalResponses: number;
//   correctResponses: number;
//   userName: string;
// }) => {
//   const positionColorMap: Record<number, string> = { 1: '#D69516', 2: '#3E3E3E', 3: '#583B0F' };
//   return (
//     <Flex align="center" justify="between">
//       <Box
//         css={{
//           backgroundColor: positionColorMap[position] || '',
//           p: '$4',
//           borderRadius: '$round',
//           color: position > 3 ? '$on_surface_low' : '#FFF',
//         }}
//       >
//         {position}
//       </Box>
//       <Box>
//         <Text variant="sm" css={{ fontWeight: '$semiBold', color: '$on_surface_high' }}>
//           {userName}
//         </Text>
//         <Text>
//           {score} point{score === 1 ? '' : 's'}
//         </Text>
//       </Box>
//       {position === 1 ? <TrophyFilledIcon /> : null}
//       <CheckCircleIcon height={16} width={16} />
//       <Text variant="xs">
//         {correctResponses}/{totalResponses}
//       </Text>
//     </Flex>
//   );
// };

export const Leaderboard = ({ pollID }: { pollID: string }) => {
  const hmsActions = useHMSActions();
  const poll = useHMSStore(selectPollByID(pollID));
  const [pollLeaderboard, setPollLeaderboard] = useState<any>();
  const { setPollView } = usePollViewState();
  const toggleSidepane = useSidepaneToggle();

  useEffect(() => {
    const fetchLeaderboardData = async () => {
      if (poll) {
        const leaderboardData = await hmsActions.interactivityCenter.fetchLeaderboard(poll, 0, 50);
        setPollLeaderboard(leaderboardData);
      }
    };
    fetchLeaderboardData();
  }, [poll, hmsActions.interactivityCenter]);

  if (!poll || !pollLeaderboard) return <Loading />;

  return (
    <Box>
      <Flex justify="between" align="center" css={{ flexGrow: 1, py: '$8', borderBottom: '1px solid $border_bright' }}>
        <Flex align="center" css={{ gap: '$4' }}>
          <Flex
            css={{ color: '$on_surface_medium', '&:hover': { color: '$on_surface_high', cursor: 'pointer' } }}
            onClick={() => setPollView(POLL_VIEWS.VOTE)}
          >
            <ChevronLeftIcon />
          </Flex>
          <Text variant="lg" css={{ fontWeight: '$semiBold' }}>
            {poll.title}
          </Text>
          <StatusIndicator isLive={false} />
        </Flex>
        <Flex
          css={{ color: '$on_surface_medium', '&:hover': { color: '$on_surface_high', cursor: 'pointer' } }}
          onClick={toggleSidepane}
        >
          <CrossIcon />
        </Flex>
      </Flex>
      <Text variant="sm" css={{ fontWeight: '$semiBold' }}>
        Leaderboard
      </Text>
      <Text variant="xs" css={{ color: '$on_surface_medium' }}>
        Based on score and time taken to cast the correct answer
      </Text>
      {/* {pollLeaderboard?.entries.map(question => (
        <LeaderboardEntry
          key={question.position}
          position={question.position}
          score={question.score}
          totalResponses={question.totalResponses}
          correctResponses={question.correctResponses}
          userName={question.peer.username || ''}
        />
      ))} */}
    </Box>
  );
};
