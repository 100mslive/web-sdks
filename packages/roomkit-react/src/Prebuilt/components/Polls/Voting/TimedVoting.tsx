import React, { useState } from 'react';
import { HMSPoll, selectLocalPeerID, useHMSStore } from '@100mslive/react-sdk';
// @ts-ignore
import { QuestionCard } from './QuestionCard';
// @ts-ignore
import { getLastAttemptedIndex } from '../../../common/utils';

export const TimedView = ({ poll }: { poll: HMSPoll }) => {
  const localPeerId = useHMSStore(selectLocalPeerID);
  const lastAttemptedIndex = getLastAttemptedIndex(poll.questions, localPeerId, '');
  const [currentIndex, setCurrentIndex] = useState(lastAttemptedIndex);
  const activeQuestion = poll.questions?.find(question => question.index === currentIndex);
  const attemptedAll = poll.questions?.length === lastAttemptedIndex - 1;

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
            responses={question.responses}
            answer={question.answer}
            setCurrentIndex={setCurrentIndex}
            rolesThatCanViewResponses={poll.rolesThatCanViewResponses}
          />
        ) : null;
      })}
    </>
  );
};
