import React from "react";
import { Box, Flex, Text } from "@100mslive/react-ui";
import { Container, ContentHeader } from "../Streaming/Common";
import { useSidepaneToggle } from "../AppData/useSidepane";
import { QUESTION_TYPE, SIDE_PANE_OPTIONS } from "../../common/constants";
import { CrossIcon } from "@100mslive/react-icons";
import { QuestionCard } from "./QuestionCard";
import { StatusIndicator } from "./StatusIndicator";

export const Voting = () => {
  const toggleVoting = useSidepaneToggle(SIDE_PANE_OPTIONS.VOTING);
  const pollCreator = "Tyler";
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
          <StatusIndicator />

          <CrossIcon
            onClick={toggleVoting}
            style={{ marginLeft: "auto", cursor: "pointer" }}
          />
        </Flex>
      </Box>

      <Flex direction="column" css={{ p: "$8 $10" }}>
        <Text css={{ color: "$textMedEmp", fontWeight: "$semiBold" }}>
          {pollCreator} started a poll
        </Text>
        <QuestionCard
          index={1}
          totalCount={3}
          questionType={QUESTION_TYPE.SINGLE_CHOICE}
          question="A single choice question"
          options={{}}
        />
        <QuestionCard
          index={2}
          totalCount={2}
          questionType={QUESTION_TYPE.MULTIPLE_CHOICE}
          question="Another one"
          options={{}}
        />
      </Flex>
    </Container>
  );
};
