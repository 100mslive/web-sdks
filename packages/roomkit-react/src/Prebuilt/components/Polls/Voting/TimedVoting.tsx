import React, { useState } from 'react';
import { HMSPoll } from '@100mslive/react-sdk';
// @ts-ignore
import { QuestionCard } from './QuestionCard';

export const TimedView = ({ poll }: { poll: HMSPoll }) => {
  // backend question index starts at 1
  const [currentIndex, setCurrentIndex] = useState(1);
  const activeQuestion = poll.questions?.find(question => question.index === currentIndex);
  if (!activeQuestion) {
    return null;
  }

  return (
    <QuestionCard
      pollID={poll.id}
      isQuiz={poll.type === 'quiz'}
      startedBy={poll.startedBy}
      pollState={poll.state}
      index={activeQuestion.index}
      text={activeQuestion.text}
      type={activeQuestion.type}
      result={activeQuestion?.result}
      totalQuestions={poll.questions?.length || 0}
      options={activeQuestion.options}
      skippable={activeQuestion.skippable || false}
      responses={activeQuestion.responses}
      answer={activeQuestion.answer}
      setCurrentIndex={setCurrentIndex}
      rolesThatCanViewResponses={poll.rolesThatCanViewResponses}
      isTimed
    />
  );
};
