import { useState } from "react";
import { QuestionCard } from "../QuestionCard";

export const TimedView = ({ questions = [] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const activeQuestion = questions[currentIndex];
  return (
    <QuestionCard
      index={currentIndex}
      question={activeQuestion.question}
      questionType={activeQuestion.questionType}
      options={activeQuestion.options}
      totalCount={questions.length}
      isSkippable={activeQuestion?.isSkippable || false}
      setCurrentIndex={setCurrentIndex}
      isTimed
    />
  );
};
