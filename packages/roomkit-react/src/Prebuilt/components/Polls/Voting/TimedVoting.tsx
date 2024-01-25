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
      responses={activeQuestion.responses}
      answer={activeQuestion.answer}
      setCurrentIndex={setCurrentIndex}
      rolesThatCanViewResponses={poll.rolesThatCanViewResponses}
    />
  );
};
