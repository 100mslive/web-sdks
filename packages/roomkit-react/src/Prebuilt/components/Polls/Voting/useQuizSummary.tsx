import { useEffect, useState } from 'react';
import {
  HMSNotificationTypes,
  HMSQuizLeaderboardResponse,
  HMSQuizLeaderboardSummary,
  selectPollByID,
  useHMSActions,
  useHMSNotifications,
  useHMSStore,
} from '@100mslive/react-sdk';

export const useQuizSummary = (quizID: string) => {
  const hmsActions = useHMSActions();
  const quiz = useHMSStore(selectPollByID(quizID));
  const pollEndNotification = useHMSNotifications(HMSNotificationTypes.POLL_STOPPED);
  const [quizLeaderboard, setQuizLeaderboard] = useState<HMSQuizLeaderboardResponse | undefined>();

  const summary: HMSQuizLeaderboardSummary = quizLeaderboard?.summary || {
    totalUsers: 0,
    votedUsers: 0,
    avgScore: 0,
    avgTime: 0,
    correctAnswers: 0,
  };

  const defaultCalculations = { maxPossibleScore: 0, totalResponses: 0 };

  const { maxPossibleScore, totalResponses } =
    quiz?.questions?.reduce((accumulator, question) => {
      accumulator.maxPossibleScore += question.weight || 0;
      accumulator.totalResponses += question?.responses?.length || 0;
      return accumulator;
    }, defaultCalculations) || defaultCalculations;

  useEffect(() => {
    const fetchLeaderboardData = async () => {
      if (!quizLeaderboard && quiz && quiz?.anonymous && quiz.state === 'stopped') {
        const leaderboardData = await hmsActions.interactivityCenter.fetchLeaderboard(quiz.id, 0, 50);
        setQuizLeaderboard(leaderboardData);
      }
    };

    if (pollEndNotification) {
      fetchLeaderboardData();
    }
  }, [quiz, hmsActions.interactivityCenter, quizLeaderboard, pollEndNotification]);

  return { quizLeaderboard, summary, maxPossibleScore, totalResponses };
};
