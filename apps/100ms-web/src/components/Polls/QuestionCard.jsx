import { useState } from "react";
import { Box, Button, Text, Flex, Input } from "@100mslive/react-ui";
import { QUESTION_TYPE } from "../../common/constants";
import { SingleChoiceOptions } from "./SingleChoiceOptions";
import { MultipleChoiceOptions } from "./MultipleChoiceOptions";

export const QuestionCard = ({
  index,
  totalCount,
  questionType,
  question,
  options = [],
  isSkippable = false,
}) => {
  const [voted, setVoted] = useState(false);
  const stringAnswerExpected = [
    QUESTION_TYPE.LONG_ANSWER,
    QUESTION_TYPE.SHORT_ANSWER,
  ].includes(questionType);

  return (
    <Box
      css={{
        backgroundColor: "$surfaceLight",
        borderRadius: "$1",
        p: "$md",
        mt: "$md",
      }}
    >
      <Text
        variant="caption"
        css={{ color: "$textDisabled", fontWeight: "$semiBold" }}
      >
        QUESTION {index} OF {totalCount}: {questionType}
      </Text>
      <Box css={{ my: "$md" }}>
        <Text css={{ color: "$textHighEmp" }}>{question}</Text>
      </Box>

      {stringAnswerExpected ? (
        <Input
          placeholder="Enter your answer"
          css={{
            w: "100%",
            backgroundColor: "$surfaceLighter",
            mb: "$md",
            border: "1px solid $borderDefault",
          }}
        />
      ) : null}

      {questionType === QUESTION_TYPE.SINGLE_CHOICE ? (
        <SingleChoiceOptions voted={voted} />
      ) : null}

      {questionType === QUESTION_TYPE.MULTIPLE_CHOICE ? (
        <MultipleChoiceOptions voted={voted} />
      ) : null}

      <Flex align="center" justify="end" css={{ gap: "$4", w: "100%" }}>
        {isSkippable && !voted ? (
          <Button
            variant="standard"
            css={{ p: "$xs $10", fontWeight: "$semiBold" }}
          >
            Skip
          </Button>
        ) : null}

        {voted ? (
          <Text css={{ fontWeight: "$semiBold", color: "$textMedEmp" }}>
            {stringAnswerExpected ? "Submitted" : "Voted"}
          </Text>
        ) : (
          <Button
            css={{ p: "$xs $10", fontWeight: "$semiBold" }}
            onClick={() => setVoted(true)}
          >
            {stringAnswerExpected ? "Submit" : "Vote"}
          </Button>
        )}
      </Flex>
    </Box>
  );
};
