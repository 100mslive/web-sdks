import { QuestionCard } from "../QuestionCard";

export const StandardView = ({ questions }) => {
  return questions.map((question, index) => (
    <QuestionCard
      key={`${question}-${index}`}
      index={index}
      question={question.question}
      questionType={question.questionType}
      totalCount={questions.length}
      options={question.options}
    />
  ));
};
