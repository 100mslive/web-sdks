import React, { useState } from 'react';
import { selectPollByID, useHMSStore } from '@100mslive/react-sdk';
import { ChevronLeftIcon, ChevronRightIcon, CrossIcon } from '@100mslive/react-icons';
import { Box, Flex } from '../../../../Layout';
import { Loading } from '../../../../Loading';
import { Text } from '../../../../Text';
// @ts-ignore
import { Container } from '../../Streaming/Common';
import { LeaderboardEntry } from './LeaderboardEntry';
import { PeerParticipationSummary } from './PeerParticipationSummary';
// @ts-ignore
import { useSidepaneToggle } from '../../AppData/useSidepane';
// @ts-ignore
import { usePollViewState } from '../../AppData/useUISettings';
import { useQuizSummary } from './useQuizSummary';
// @ts-ignore
import { StatusIndicator } from '../common/StatusIndicator';
import { POLL_VIEWS } from '../../../common/constants';

export const LeaderboardSummary = ({ pollID }: { pollID: string }) => {
  const quiz = useHMSStore(selectPollByID(pollID));
  const { quizLeaderboard, maxPossibleScore } = useQuizSummary(pollID);
  const [viewAllEntries, setViewAllEntries] = useState(false);
  const { setPollView } = usePollViewState();
  const toggleSidepane = useSidepaneToggle();

  if (!quiz || !quizLeaderboard)
    return (
      <Flex align="center" justify="center" css={{ size: '100%' }}>
        <Loading />
      </Flex>
    );

  const questionCount = quiz.questions?.length || 0;

  return (
    <Container rounded>
      <Flex direction="column" css={{ size: '100%', p: '8' }}>
        <Flex justify="between" align="center" css={{ pb: '6', borderBottom: '1px solid border.bright', mb: '8' }}>
          <Flex align="center" css={{ gap: '4' }}>
            <Flex
              css={{ color: 'onSurface.medium', '&:hover': { color: 'onSurface.high', cursor: 'pointer' } }}
              onClick={() => setPollView(POLL_VIEWS.VOTE)}
            >
              <ChevronLeftIcon />
            </Flex>
            <Text variant="lg" css={{ fontWeight: 'semiBold' }}>
              {quiz.title}
            </Text>
            <StatusIndicator status={quiz.state} />
          </Flex>
          <Flex
            css={{ color: 'onSurface.medium', '&:hover': { color: 'onSurface.high', cursor: 'pointer' } }}
            onClick={toggleSidepane}
          >
            <CrossIcon />
          </Flex>
        </Flex>
        <Box css={{ overflowY: 'auto', mr: '-$4', pr: '4' }}>
          {!viewAllEntries ? <PeerParticipationSummary quiz={quiz} /> : null}

          <Text variant="sm" css={{ fontWeight: 'semiBold', mt: '4' }}>
            Leaderboard
          </Text>
          <Text variant="xs" css={{ color: 'onSurface.medium' }}>
            Based on score and time taken to cast the correct answer
          </Text>
          <Box
            css={{
              mt: '8',
              overflowY: 'auto',
              flex: viewAllEntries ? '1 1 0' : 'unset',
              mr: viewAllEntries ? '-$6' : 'unset',
              px: viewAllEntries ? '0' : '$4',
              pr: viewAllEntries ? '$6' : '$4',
              backgroundColor: viewAllEntries ? '' : 'surface.default',
              borderRadius: '1',
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
                    duration={question.duration}
                  />
                ))}
            {quizLeaderboard?.entries?.length > 5 && !viewAllEntries ? (
              <Flex
                align="center"
                justify="end"
                css={{
                  w: '100%',
                  borderTop: '1px solid border.bright',
                  cursor: 'pointer',
                  color: 'onSurface.high',
                  p: '$6 $2',
                }}
                onClick={() => setViewAllEntries(true)}
              >
                <Text variant="sm">View All</Text> <ChevronRightIcon />
              </Flex>
            ) : null}
          </Box>
        </Box>
      </Flex>
    </Container>
  );
};
