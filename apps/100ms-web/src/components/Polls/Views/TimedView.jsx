// @ts-check
import React, { useState } from "react";
import { QuestionCard } from "../QuestionCard";

/**
 *
 * @param {{poll: import("@100mslive/react-sdk").HMSPoll}} param0
 * @returns
 */
export const TimedView = ({ poll }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const activeQuestion = poll.questions?.[currentIndex];
  if (!activeQuestion) {
    return null;
  }
  return (
    <QuestionCard
      index={currentIndex}
      text={activeQuestion.text}
      type={activeQuestion.type}
      options={activeQuestion.options}
      totalCount={poll.questions?.length || 0}
      skippable={activeQuestion?.skippable || false}
      setCurrentIndex={setCurrentIndex}
      isTimed
    />
  );
};
