// @ts-ignore: No implicit Any
import { PollsQuizMenu } from './CreatePollQuiz/PollsQuizMenu';
// @ts-ignore: No implicit Any
import { CreateQuestions } from './CreateQuestions/CreateQuestions';
import { LeaderboardSummary } from './Voting/LeaderboardSummary';
// @ts-ignore: No implicit Any
import { Voting } from './Voting/Voting';
// @ts-ignore: No implicit Any
import { usePollViewToggle } from '../AppData/useSidepane';
// @ts-ignore: No implicit Any
import { usePollViewState } from '../AppData/useUISettings';
// @ts-ignore: No implicit Any
import { POLL_VIEWS } from '../../common/constants';

export const Polls = () => {
  const togglePollView = usePollViewToggle();
  const { pollInView: pollID, view } = usePollViewState();

  if (view === POLL_VIEWS.CREATE_POLL_QUIZ) {
    return <PollsQuizMenu />;
  } else if (view === POLL_VIEWS.CREATE_QUESTIONS) {
    return <CreateQuestions />;
  } else if (view === POLL_VIEWS.VOTE) {
    return <Voting toggleVoting={togglePollView} id={pollID} />;
  } else if (view === POLL_VIEWS.RESULTS) {
    return <LeaderboardSummary pollID={pollID} />;
  } else {
    return null;
  }
};
