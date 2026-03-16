import { useEffect, useState } from 'react';
import {
  HMSQuizLeaderboardResponse,
  HMSQuizLeaderboardSummary,
  selectPollByID,
  useHMSActions,
  useHMSStore,
} from '@100mslive/react-sdk';

export const useQuizSummary = (quizID: string) => {
  const hmsActions = useHMSActions();
  const quiz = useHMSStore(selectPollByID(quizID));
  const [quizLeaderboard, setQuizLeaderboard] = useState<HMSQuizLeaderboardResponse | undefined>();

  const summary: HMSQuizLeaderboardSummary = quizLeaderboard?.summary || {
    totalUsers: 0,
    votedUsers: 0,
    avgScore: 0,
    avgTime: 0,
    correctUsers: 0,
  };
  const [calculations, setCalculations] = useState({ maxPossibleScore: 0, totalResponses: 0 });

  useEffect(() => {
    const fetchLeaderboardData = async () => {
      if (!quizLeaderboard && quiz && !quiz?.anonymous && quiz.state === 'stopped') {
        const leaderboardData = await hmsActions.interactivityCenter.fetchLeaderboard(quiz.id, 0, 200);

        const { maxPossibleScore, totalResponses } =
          quiz?.questions?.reduce((accumulator, question) => {
            accumulator.maxPossibleScore += question.weight || 0;
            accumulator.totalResponses += question?.responses?.length || 0;
            return accumulator;
          }, calculations) || calculations;

        setQuizLeaderboard(leaderboardData);
        setCalculations({ maxPossibleScore, totalResponses });
      }
    };

    fetchLeaderboardData();
  }, [quiz, hmsActions.interactivityCenter, quizLeaderboard, calculations]);

  return {
    quizLeaderboard,
    summary,
    maxPossibleScore: calculations.maxPossibleScore,
    totalResponses: calculations.totalResponses,
  };
};
