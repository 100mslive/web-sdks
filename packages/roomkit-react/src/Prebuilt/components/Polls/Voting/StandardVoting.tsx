import { Dispatch, SetStateAction } from 'react';
import { HMSPoll } from '@100mslive/react-sdk';
import { PeerParticipationSummary } from './PeerParticipationSummary';
// @ts-ignore
import { QuestionCard } from './QuestionCard';

export const StandardView = ({
  poll,
  localPeerResponses,
  updateSavedResponses,
}: {
  poll: HMSPoll;
  localPeerResponses: Record<number, number | number[] | undefined>;
  updateSavedResponses: Dispatch<SetStateAction<Record<any, any>>>;
}) => {
  if (!poll?.questions) {
    return null;
  }

  const isQuiz = poll.type === 'quiz';
  const isStopped = poll.state === 'stopped';

  return (
    <>
      {isQuiz && isStopped ? <PeerParticipationSummary quiz={poll} /> : null}
      {poll.questions?.map((question, index) => (
        <QuestionCard
          pollID={poll.id}
          isQuiz={isQuiz}
          startedBy={poll.startedBy}
          pollState={poll.state}
          key={`${question.text}-${index}`}
          index={question.index}
          text={question.text}
          type={question.type}
          result={question.result}
          totalQuestions={poll.questions?.length || 0}
          options={question.options}
          localPeerResponse={localPeerResponses?.[question.index]}
          answer={question.answer}
          updateSavedResponses={updateSavedResponses}
          rolesThatCanViewResponses={poll.rolesThatCanViewResponses}
        />
      ))}
    </>
  );
};
