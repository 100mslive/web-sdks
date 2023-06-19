import { useEffect, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@100mslive/react-icons";
import { Box, Flex, Input, Text } from "@100mslive/react-ui";
import { QuestionCardFooter } from "./QuestionCardComponents/QuestionCardFooter";
import { MultipleChoiceOptions } from "./MultipleChoiceOptions";
import { SingleChoiceOptions } from "./SingleChoiceOptions";
import { QUESTION_TYPE } from "../../common/constants";

export const QuestionCard = ({
  index,
  totalCount,
  questionType,
  question,
  options = [],
  setCurrentIndex = () => {},
  isSkippable = false,
  isTimed = false,
}) => {
  const [voted, setVoted] = useState(false);
  const leftNavigationEnabled = index !== 0;
  const rightNavigationEnabled =
    index !== totalCount - 1 && (isSkippable || voted);

  const stringAnswerExpected = [
    QUESTION_TYPE.LONG_ANSWER,
    QUESTION_TYPE.SHORT_ANSWER,
  ].includes(questionType);

  useEffect(() => setVoted(false), [index]);

  return (
    <Box
      css={{
        backgroundColor: "$surfaceLight",
        borderRadius: "$1",
        p: "$md",
        mt: "$md",
      }}
    >
      <Flex align="center" justify="between">
        <Text
          variant="caption"
          css={{ color: "$textDisabled", fontWeight: "$semiBold" }}
        >
          QUESTION {index + 1} OF {totalCount}: {questionType.toUpperCase()}
        </Text>

        {isTimed ? (
          <Flex align="center" css={{ gap: "$4" }}>
            <Flex
              onClick={() => {
                setCurrentIndex(prev => Math.max(0, prev - 1));
                setVoted(false);
              }}
              css={
                leftNavigationEnabled
                  ? { color: "$textHighEmp", cursor: "pointer" }
                  : {
                      color: "$textDisabled",
                      cursor: "not-allowed",
                    }
              }
            >
              <ChevronLeftIcon height={16} width={16} />
            </Flex>
            <Flex
              onClick={() => {
                setCurrentIndex(prev => Math.min(totalCount, prev + 1));
                setVoted(false);
              }}
              css={
                rightNavigationEnabled
                  ? { color: "$textHighEmp", cursor: "pointer" }
                  : {
                      color: "$textDisabled",
                      cursor: "not-allowed",
                    }
              }
            >
              <ChevronRightIcon height={16} width={16} />
            </Flex>
          </Flex>
        ) : null}
      </Flex>

      <Box css={{ my: "$md" }}>
        <Text css={{ color: "$textHighEmp" }}>{question}</Text>
      </Box>

      {stringAnswerExpected ? (
        <Input
          disabled={voted}
          placeholder="Enter your answer"
          css={{
            w: "100%",
            backgroundColor: "$surfaceLighter",
            mb: "$md",
            border: "1px solid $borderDefault",
            cursor: voted ? "not-allowed" : "text",
          }}
        />
      ) : null}

      {questionType === QUESTION_TYPE.SINGLE_CHOICE ? (
        <SingleChoiceOptions voted={voted} options={options} />
      ) : null}

      {questionType === QUESTION_TYPE.MULTIPLE_CHOICE ? (
        <MultipleChoiceOptions voted={voted} options={options} />
      ) : null}

      <QuestionCardFooter
        isSkippable={isSkippable}
        voted={voted}
        stringAnswerExpected={stringAnswerExpected}
        setVoted={setVoted}
      />
    </Box>
  );
};
