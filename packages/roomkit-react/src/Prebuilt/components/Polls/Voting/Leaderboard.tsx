import React, { useEffect, useState } from 'react';
import { HMSPollLeaderboardEntry } from '@100mslive/hms-video';
import {
  HMSPollLeaderboardResponse,
  HMSPollQuestion,
  selectPollByID,
  useHMSActions,
  useHMSStore,
} from '@100mslive/react-sdk';
import { ChevronLeftIcon, CrossIcon } from '@100mslive/react-icons';
import { Box, Flex } from '../../../../Layout';
import { Loading } from '../../../../Loading';
import { Text } from '../../../../Text';
import { LeaderboardEntry } from './LeaderboardEntry';
// @ts-ignore
import { useSidepaneToggle } from '../../AppData/useSidepane';
// @ts-ignore
import { usePollViewState } from '../../AppData/useUISettings';
// @ts-ignore
import { StatusIndicator } from '../common/StatusIndicator';
import { POLL_VIEWS } from '../../../common/constants';

export const Leaderboard = ({ pollID }: { pollID: string }) => {
  const hmsActions = useHMSActions();
  const poll = useHMSStore(selectPollByID(pollID));
  const [pollLeaderboard, setPollLeaderboard] = useState<HMSPollLeaderboardResponse>();
  const { setPollView } = usePollViewState();
  const toggleSidepane = useSidepaneToggle();
  // const sharedLeaderboardRef = useRef(false);
  // const sharedLeaderboards = useHMSStore(selectSessionStore(SESSION_STORE_KEY.SHARED_LEADERBOARDS));
  // const { sendEvent } = useCustomEvent({
  //   type: HMSNotificationTypes.POLL_LEADERBOARD_SHARED,
  //   onEvent: () => {
  //     return;
  //   },
  // });

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
  const maxPossibleScore = poll.questions.reduce(
    (total: number, question: HMSPollQuestion) => (total += question.weight || 0),
    0,
  );

  return (
    <Box>
      <Flex
        justify="between"
        align="center"
        css={{ flexGrow: 1, py: '$6', borderBottom: '1px solid $border_bright', mb: '$8' }}
      >
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
      <Box css={{ mt: '$8' }}>
        {pollLeaderboard?.entries &&
          pollLeaderboard.entries.map((question: HMSPollLeaderboardEntry) => (
            <LeaderboardEntry
              key={question.position}
              position={question.position}
              score={question.score}
              totalResponses={question.totalResponses}
              correctResponses={question.correctResponses}
              userName={question.peer.username || ''}
              maxPossibleScore={maxPossibleScore}
            />
          ))}
      </Box>

      {/* {!sharedLeaderboardRef.current ? (
        <Button
          css={{ ml: 'auto', mt: '$8' }}
          onClick={() => {
            const currentlySharedLeaderboards = sharedLeaderboards || [];
            hmsActions.sessionStore.set(SESSION_STORE_KEY.SHARED_LEADERBOARDS, [
              ...currentlySharedLeaderboards,
              pollID,
            ]);
            const pollDetails = { initiatorName: '', startedBy: poll.startedBy, id: pollID };
            sendEvent();
            sharedLeaderboardRef.current = true;
          }}
        >
          Share Results
        </Button>
      ) : null} */}
    </Box>
  );
};
