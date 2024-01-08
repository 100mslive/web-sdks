import React, { useEffect, useState } from 'react';
import {
  HMSQuizLeaderboardResponse,
  HMSQuizLeaderboardSummary,
  selectPollByID,
  useHMSActions,
  useHMSStore,
} from '@100mslive/react-sdk';
import { ChevronLeftIcon, ChevronRightIcon, CrossIcon } from '@100mslive/react-icons';
import { Box, Flex } from '../../../../Layout';
import { Loading } from '../../../../Loading';
import { Text } from '../../../../Text';
import { LeaderboardEntry } from './LeaderboardEntry';
import { StatisticBox } from './StatisticBox';
// @ts-ignore
import { useSidepaneToggle } from '../../AppData/useSidepane';
// @ts-ignore
import { usePollViewState } from '../../AppData/useUISettings';
// @ts-ignore
import { StatusIndicator } from '../common/StatusIndicator';
import { POLL_VIEWS } from '../../../common/constants';

export const LeaderboardSummary = ({ pollID }: { pollID: string }) => {
  const hmsActions = useHMSActions();
  const quiz = useHMSStore(selectPollByID(pollID));
  const [quizLeaderboard, setQuizLeaderboard] = useState<HMSQuizLeaderboardResponse | undefined>();
  const [viewAllEntries, setViewAllEntries] = useState(false);
  const summary: HMSQuizLeaderboardSummary = quizLeaderboard?.summary || {
    totalUsers: 0,
    votedUsers: 0,
    avgScore: 0,
    avgTime: 0,
    correctAnswers: 0,
  };

  const { setPollView } = usePollViewState();
  const toggleSidepane = useSidepaneToggle();

  useEffect(() => {
    const fetchLeaderboardData = async () => {
      if (!quizLeaderboard && quiz) {
        const leaderboardData = await hmsActions.interactivityCenter.fetchLeaderboard(quiz.id, 0, 50);
        setQuizLeaderboard(leaderboardData);
      }
    };
    fetchLeaderboardData();
  }, [quiz, hmsActions.interactivityCenter, quizLeaderboard]);

  if (!quiz || !quizLeaderboard)
    return (
      <Flex align="center" justify="center" css={{ size: '100%' }}>
        <Loading />
      </Flex>
    );

  const defaultCalculations = { maxPossibleScore: 0, totalResponses: 0 };
  const { maxPossibleScore, totalResponses } =
    quiz.questions?.reduce((accumulator, question) => {
      accumulator.maxPossibleScore += question.weight || 0;
      accumulator.totalResponses += question?.responses?.length || 0;
      return accumulator;
    }, defaultCalculations) || defaultCalculations;

  const questionCount = quiz.questions?.length || 0;

  return (
    <Flex direction="column" css={{ size: '100%' }}>
      <Flex justify="between" align="center" css={{ pb: '$6', borderBottom: '1px solid $border_bright', mb: '$8' }}>
        <Flex align="center" css={{ gap: '$4' }}>
          <Flex
            css={{ color: '$on_surface_medium', '&:hover': { color: '$on_surface_high', cursor: 'pointer' } }}
            onClick={() => setPollView(POLL_VIEWS.VOTE)}
          >
            <ChevronLeftIcon />
          </Flex>
          <Text variant="lg" css={{ fontWeight: '$semiBold' }}>
            {quiz.title}
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

      {!viewAllEntries ? (
        <Box css={{ py: '$4' }}>
          <Text variant="sm" css={{ fontWeight: '$semiBold' }}>
            Participation Summary
          </Text>

          <Box css={{ my: '$4' }}>
            <Flex css={{ w: '100%', gap: '$4' }}>
              <StatisticBox
                title="Voted"
                value={`${summary?.totalUsers ? (100 * summary?.votedUsers) / summary?.totalUsers : 0}%`}
              />
              <StatisticBox title="Correct Answers" value={`${summary?.correctAnswers}/${totalResponses}`} />
            </Flex>
            <Flex css={{ w: '100%', gap: '$4', mt: '$4' }}>
              {summary?.avgTime > 0 ? <StatisticBox title="Avg. Time" value={summary?.avgTime} /> : null}
              <StatisticBox title="Avg. Score" value={summary?.avgScore} />
            </Flex>
          </Box>
        </Box>
      ) : null}

      <Text variant="sm" css={{ fontWeight: '$semiBold' }}>
        Leaderboard
      </Text>
      <Text variant="xs" css={{ color: '$on_surface_medium' }}>
        Based on score and time taken to cast the correct answer
      </Text>
      <Box
        css={{
          mt: '$8',
          overflowY: 'auto',
          flex: viewAllEntries ? '1 1 0' : 'unset',
          mr: viewAllEntries ? '-$6' : 'unset',
          px: viewAllEntries ? '0' : '$4',
          pr: viewAllEntries ? '$6' : '$4',
          backgroundColor: viewAllEntries ? '' : '$surface_default',
          borderRadius: '$1',
        }}
      >
        {quizLeaderboard?.entries &&
          quizLeaderboard.entries
            .slice(0, viewAllEntries ? undefined : 5)
            .map(question => (
              <LeaderboardEntry
                key={question.position}
                position={question.position}
                score={question.score}
                questionCount={questionCount}
                correctResponses={question.correctResponses}
                userName={question.peer.username || ''}
                maxPossibleScore={maxPossibleScore}
              />
            ))}
        {quizLeaderboard?.entries?.length > 5 && !viewAllEntries ? (
          <Flex
            align="center"
            justify="end"
            css={{
              w: '100%',
              borderTop: '1px solid $border_bright',
              cursor: 'pointer',
              color: '$on_surface_high',
              p: '$6 $2',
            }}
            onClick={() => setViewAllEntries(true)}
          >
            <Text variant="sm">View All</Text> <ChevronRightIcon />
          </Flex>
        ) : null}
      </Box>
    </Flex>
  );
};
