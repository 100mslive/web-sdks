import React, { useState } from 'react';
import { HMSPoll } from '@100mslive/react-sdk';
// @ts-ignore
import { QuestionCard } from './QuestionCard';

export const TimedView = ({ poll }: { poll: HMSPoll }) => {
  // Backend question index starts at 1
  const [currentIndex, setCurrentIndex] = useState(1);
  const activeQuestion = poll.questions?.find(question => question.index === currentIndex);

  if (!activeQuestion) {
    return null;
  }

  return (
    <>
      {poll.questions?.map(question =>
        currentIndex === question.index ? (
          <QuestionCard
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
        ) : null,
      )}
    </>
  );
};
