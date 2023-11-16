import React from 'react';
import { QuizIcon } from '@100mslive/react-icons';
import { Tooltip } from '../../..';
// @ts-ignore: No implicit Any
import IconButton from '../../IconButton';
// @ts-ignore: No implicit Any
import { useIsSidepaneTypeOpen, usePollViewToggle } from '../AppData/useSidepane';
// @ts-ignore: No implicit Any
import { SIDE_PANE_OPTIONS } from '../../common/constants';

export const PollsToggle = () => {
  const isPollsOpen = useIsSidepaneTypeOpen(SIDE_PANE_OPTIONS.POLLS);
  const togglePollView = usePollViewToggle();

  return (
    <Tooltip key="polls" title={`${isPollsOpen ? 'Close' : 'Open'} polls and quizzes`}>
      <IconButton onClick={togglePollView} active={!isPollsOpen} data-testid="polls_btn">
        <QuizIcon />
      </IconButton>
    </Tooltip>
  );
};
