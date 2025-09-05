import React, { useEffect } from 'react';
import { QuizActiveIcon, QuizIcon } from '@100mslive/react-icons';
import { Tooltip } from '../../..';
// @ts-ignore: No implicit Any
import IconButton from '../../IconButton';
// @ts-ignore: No implicit Any
import { useIsSidepaneTypeOpen, usePollViewToggle } from '../AppData/useSidepane';
import { useUnreadPollQuizPresent } from '../hooks/useUnreadPollQuizPresent';
// @ts-ignore: No implicit Any
import { SIDE_PANE_OPTIONS } from '../../common/constants';

export const PollsToggle = () => {
  const isPollsOpen = useIsSidepaneTypeOpen(SIDE_PANE_OPTIONS.POLLS);
  const togglePollView = usePollViewToggle();
  const { unreadPollQuiz, setUnreadPollQuiz } = useUnreadPollQuizPresent();

  useEffect(() => {
    if (unreadPollQuiz && isPollsOpen) {
      setUnreadPollQuiz(false);
    }
  }, [isPollsOpen, unreadPollQuiz, setUnreadPollQuiz]);

  return (
    <Tooltip key="polls" title={`${isPollsOpen ? 'Close' : 'Open'} polls and quizzes`}>
      <IconButton
        onClick={() => {
          togglePollView();
          setUnreadPollQuiz(false);
        }}
        css={{ bg: isPollsOpen ? 'surface.brighter' : '' }}
        data-testid="polls_btn"
      >
        {unreadPollQuiz ? <QuizActiveIcon /> : <QuizIcon />}
      </IconButton>
    </Tooltip>
  );
};
