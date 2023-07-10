// @ts-check
import React, { useCallback, useState } from "react";
import { useHMSActions, useHMSStore } from "@100mslive/react-sdk";
import { ChevronLeftIcon, ChevronRightIcon } from "@100mslive/react-icons";
import {
  Box,
  Flex,
  IconButton,
  Input,
  styled,
  Text,
} from "@100mslive/react-ui";
import { QuestionCardFooter } from "./QuestionCardComponents/QuestionCardFooter";
import { MultipleChoiceOptions } from "./MultipleChoiceOptions";
import { SingleChoiceOptions } from "./SingleChoiceOptions";
import { QUESTION_TYPE } from "../../common/constants";

const TextArea = styled("textarea", {
  backgroundColor: "$surfaceLighter",
  border: "1px solid $borderLight",
  borderRadius: "$1",
  mb: "$md",
  color: "$textHighEmp",
  resize: "none",
  p: "$2",
  w: "100%",
});

const selectLocalPeerReponse =
  (pollID, questionIndex) =>
  (/** @type {import("@100mslive/react-sdk").HMSStore} */ store) => {
    const localPeerID = store.room.localPeer;
    const poll = pollID ? store.polls[pollID] : null;
    const question = poll?.questions?.find(
      question => question.index === questionIndex
    );

    return question?.responses?.find(
      response => response.peer?.peerid === localPeerID
    );
  };

export const QuestionCard = ({
  pollID,
  index,
  totalQuestions,
  totalResponses,
  type,
  text,
  options = [],
  setCurrentIndex,
  skippable = false,
  isTimed = false,
}) => {
  const actions = useHMSActions();
  const response = useHMSStore(selectLocalPeerReponse(pollID, index));
  const prev = index !== 1;
  const next = index !== totalQuestions && (skippable || response);
  const [textAnswer, setTextAnswer] = useState("");
  const [singleOptionAnswer, setSingleOptionAnswer] = useState();
  const [multipleOptionAnswer, setMultipleOptionAnswer] = useState(new Set());

  const stringAnswerExpected = [
    QUESTION_TYPE.LONG_ANSWER,
    QUESTION_TYPE.SHORT_ANSWER,
  ].includes(type);

  const handleVote = useCallback(async () => {
    await actions.interactivityCenter.addResponsesToPoll(pollID, [
      {
        questionIndex: index,
        text: textAnswer,
        option: singleOptionAnswer,
        options: Array.from(multipleOptionAnswer).sort(),
      },
    ]);
  }, [
    actions,
    index,
    pollID,
    textAnswer,
    singleOptionAnswer,
    multipleOptionAnswer,
  ]);

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
          QUESTION {index} OF {totalQuestions}: {type.toUpperCase()}
        </Text>

        {isTimed ? (
          <Flex align="center" css={{ gap: "$4" }}>
            <IconButton
              disabled={!prev}
              onClick={() => {
                setCurrentIndex(prev => Math.max(0, prev - 1));
              }}
              css={
                prev
                  ? { color: "$textHighEmp", cursor: "pointer" }
                  : {
                      color: "$textDisabled",
                      cursor: "not-allowed",
                    }
              }
            >
              <ChevronLeftIcon height={16} width={16} />
            </IconButton>
            <IconButton
              disabled={!next}
              onClick={() => {
                setCurrentIndex(prev => Math.min(totalQuestions, prev + 1));
              }}
              css={
                next
                  ? { color: "$textHighEmp", cursor: "pointer" }
                  : {
                      color: "$textDisabled",
                      cursor: "not-allowed",
                    }
              }
            >
              <ChevronRightIcon height={16} width={16} />
            </IconButton>
          </Flex>
        ) : null}
      </Flex>

      <Box css={{ my: "$md" }}>
        <Text css={{ color: "$textHighEmp" }}>{text}</Text>
      </Box>

      {type === QUESTION_TYPE.SHORT_ANSWER ? (
        <Input
          disabled={!!response}
          placeholder="Enter your answer"
          onChange={e => setTextAnswer(e.target.value)}
          css={{
            w: "100%",
            backgroundColor: "$surfaceLighter",
            mb: "$md",
            border: "1px solid $borderDefault",
            cursor: response ? "not-allowed" : "text",
          }}
        />
      ) : null}

      {type === QUESTION_TYPE.LONG_ANSWER ? (
        <TextArea
          disabled={!!response}
          placeholder="Enter your answer"
          onChange={e => setTextAnswer(e.target.value)}
        />
      ) : null}

      {type === QUESTION_TYPE.SINGLE_CHOICE ? (
        <SingleChoiceOptions
          response={response}
          options={options}
          setAnswer={setSingleOptionAnswer}
          totalResponses={totalResponses}
        />
      ) : null}

      {type === QUESTION_TYPE.MULTIPLE_CHOICE ? (
        <MultipleChoiceOptions
          response={response}
          options={options}
          selectedOptions={multipleOptionAnswer}
          setSelectedOptions={setMultipleOptionAnswer}
          totalResponses={totalResponses}
        />
      ) : null}

      <QuestionCardFooter
        skippable={skippable}
        skipQuestion={() => {
          setCurrentIndex(prev => Math.min(totalQuestions, prev + 1));
        }}
        response={response}
        stringAnswerExpected={stringAnswerExpected}
        handleVote={handleVote}
      />
    </Box>
  );
};
