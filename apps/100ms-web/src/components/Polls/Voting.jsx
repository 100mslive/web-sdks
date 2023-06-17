import React from "react";
import { CrossIcon } from "@100mslive/react-icons";
import { Box, Flex, Text } from "@100mslive/react-ui";
import { StandardView } from "./Views/StandardView";
import { TimedView } from "./Views/TimedView";
import { Container } from "../Streaming/Common";
import { StatusIndicator } from "./StatusIndicator";
import { useSidepaneToggle } from "../AppData/useSidepane";
import { QUESTION_TYPE, SIDE_PANE_OPTIONS } from "../../common/constants";

export const Voting = () => {
  const toggleVoting = useSidepaneToggle(SIDE_PANE_OPTIONS.VOTING);
  const pollCreator = "Tyler";

  // Sets view - linear or vertical, toggles timer indicator
  const isTimed = false;

  return (
    <Container rounded>
      <Box css={{ px: "$10" }}>
        <Flex
          align="center"
          css={{
            gap: "$6",
            py: "$10",
            w: "100%",
            color: "$textHighEmp",
            borderBottom: "1px solid $borderDefault",
          }}
        >
          <Text variant="h6">Poll</Text>
          <StatusIndicator isTimed={isTimed} />
          <Box
            css={{
              marginLeft: "auto",
              cursor: "pointer",
              "&:hover": { opacity: "0.8" },
            }}
          >
            <CrossIcon onClick={toggleVoting} />
          </Box>
        </Flex>
      </Box>

      <Flex direction="column" css={{ p: "$8 $10" }}>
        <Text css={{ color: "$textMedEmp", fontWeight: "$semiBold" }}>
          {pollCreator} started a poll
        </Text>
        {isTimed ? (
          <TimedView questions={questions} />
        ) : (
          <StandardView questions={questions} />
        )}
      </Flex>
    </Container>
  );
};

const questions = [
  {
    questionType: QUESTION_TYPE.SINGLE_CHOICE,
    question: "A single choice question",
    options: [
      { text: "A", voters: ["Alex Kar", "San France", "Rachel"] },
      { text: "B", voters: ["Boris Johnson", "James Franco"] },
      { text: "C", voters: [] },
    ],
  },
  {
    questionType: QUESTION_TYPE.MULTIPLE_CHOICE,
    question: "A multiple choice question",
    options: [
      { text: "A", voters: ["Alex Kar", "San France", "Rachel"] },
      { text: "B", voters: ["Boris Johnson", "James Franco"] },
      { text: "C", voters: [] },
      { text: "D", voters: [] },
    ],
  },
  {
    questionType: QUESTION_TYPE.SHORT_ANSWER,
    question: "A short answer type question",
    options: [],
  },
];
