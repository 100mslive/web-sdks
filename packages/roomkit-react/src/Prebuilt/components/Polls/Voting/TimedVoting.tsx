import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { HMSPoll } from '@100mslive/react-sdk';
// @ts-ignore
import { QuestionCard } from './QuestionCard';
// @ts-ignore
import { getIndexToShow } from '../../../common/utils';

export const TimedView = ({
  poll,
  localPeerResponses,
  updateSavedResponses,
}: {
  poll: HMSPoll;
  localPeerResponses?: Record<number, number | number[] | undefined>;
  updateSavedResponses: Dispatch<SetStateAction<Record<any, any>>>;
}) => {
  const [currentIndex, setCurrentIndex] = useState(getIndexToShow(localPeerResponses));
  const activeQuestion = poll.questions?.find(question => question.index === currentIndex);
  const attemptedAll = (poll.questions?.length || 0) < currentIndex;

  // Handles increments so only one question is shown at a time in quiz
  useEffect(() => {
    setCurrentIndex(getIndexToShow(localPeerResponses));
  }, [localPeerResponses]);

  if ((!activeQuestion && !attemptedAll) || !poll.questions?.length) {
    return null;
  }

  return (
    <>
      {poll.questions.map(question => {
        return attemptedAll || activeQuestion?.index === question.index ? (
          <QuestionCard
            key={question.index}
            pollID={poll.id}
            isQuiz={poll.type === 'quiz'}
            startedBy={poll.startedBy}
            pollState={poll.state}
            index={question.index}
            text={question.text}
            type={question.type}
            result={question?.result}
            totalQuestions={poll.questions?.length || 0}
            options={question.options}
            localPeerResponse={localPeerResponses?.[question.index]}
            answer={question.answer}
            rolesThatCanViewResponses={poll.rolesThatCanViewResponses}
            updateSavedResponses={updateSavedResponses}
          />
        ) : null;
      })}
    </>
  );
};
