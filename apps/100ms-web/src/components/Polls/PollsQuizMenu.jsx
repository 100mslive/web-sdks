import React from "react";
import { QuestionIcon, StatsIcon } from "@100mslive/react-icons";
import { Flex, Input, Switch, Text, Button } from "@100mslive/react-ui";
import { Container, ContentHeader } from "./Streaming/Common";
function PollsQuizMenu() {
  return (
    <Container rounded>
      <ContentHeader content="Polls/Quiz" />
      <Flex direction="column" css={{ p: "$10" }}>
        <Flex direction="column">
          <PollCard />
        </Flex>
        <Flex>
          <Button>Launch Poll</Button>
        </Flex>
      </Flex>
    </Container>
  );
}

export default PollsQuizMenu;

const questionTypes = [
  {
    title: "Poll",
    icon: <StatsIcon />,
    onClick: () => {},
    content: <AddPollsMenu />,
  },

  {
    title: "Poll",
    icon: <QuestionIcon />,
    onClick: () => {},
  },
];

function PollCard({ title, icon, active, onClick }) {
  return (
    <Flex
      onClick={onClick}
      css={{
        border: active
          ? "$space$px solid $borderLight"
          : "$space$px solid $borderAccent",
      }}
    >
      <Flex>{icon}</Flex>
      <Text variant="sub1" css={{ ml: "$md" }}>
        {title}
      </Text>
    </Flex>
  );
}
const pollOptions = [
  {
    title: "Hide vote count",
    onCheckedChange: () => {},
    key: "hideVoteCount",
  },
  {
    title: "Make Results Anyonmous",
    onCheckedChange: () => {},
    key: "makeResultAnynomous",
  },
  { title: "Timer", onCheckedChange: () => {}, key: "timer" },
];
const AddPollsMenu = ({ pollData, setPolls }) => {
  return (
    <Flex direction="column">
      <Flex>
        <Text variant="body2">Name this poll</Text>
        <Input />
        {pollOptions.map(option => (
          <Flex>
            <Switch onCheckedChange={option.onCheckedChange} />
            <Text>{option.title}</Text>
          </Flex>
        ))}
      </Flex>
      <Button variant="primary" onClick={setPolls}>
        Start Poll
      </Button>
    </Flex>
  );
};

const AddQuizMenu = ({ quizData, setQuiz }) => {
  return (
    <Flex direction="column">
      <Flex>
        <Text variant="body2">Name this poll</Text>
        <Input />
        {pollOptions.map(option => (
          <Flex>
            <Switch onCheckedChange={option.onCheckedChange} />
            <Text>{option.title}</Text>
          </Flex>
        ))}
      </Flex>
      <Button variant="primary" onClick={setQuiz}>
        Start Poll
      </Button>
    </Flex>
  );
};
