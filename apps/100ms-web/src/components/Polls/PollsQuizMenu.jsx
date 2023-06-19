import React, { useState } from "react";
import { useHMSActions } from "@100mslive/react-sdk";
import { QuestionIcon, StatsIcon } from "@100mslive/react-icons";
import { Button, Flex, Input, Switch, Text } from "@100mslive/react-ui";
import { Container, ContentHeader, ErrorText } from "../Streaming/Common";

const PollsQuizMenu = ({
  id,
  setInteractionSettings,
  launchQuestions,
  onBack,
}) => {
  const [interactionType, setInteractionType] = useState(
    interactionTypes["Poll"].title
  );

  return (
    <Container rounded>
      <ContentHeader content="Polls/Quiz" onBack={onBack} />
      <Flex
        direction="column"
        css={{ px: "$10", pb: "$10", overflowY: "auto" }}
      >
        <Text variant="caption" css={{ c: "$textMedEmp", mb: "$md" }}>
          Select the type you want to continue with
        </Text>
        <Flex css={{ w: "100%", gap: "$10", mb: "$md" }}>
          {Object.values(interactionTypes).map(options => (
            <InteractionSelectionCard
              {...options}
              onClick={() => setInteractionType(options.title)}
              active={interactionType === options.title}
            />
          ))}
        </Flex>
        <AddMenu
          interactionType={interactionType}
          onCreate={launchQuestions}
          id={id}
        />

        <Flex
          css={{
            borderTop: "$space$px solid $borderLight",
            mt: "$10",
            pt: "$10",
          }}
        >
          <PrevMenu />
        </Flex>
      </Flex>
    </Container>
  );
};

export default PollsQuizMenu;

function InteractionSelectionCard({ title, icon, active, onClick }) {
  const activeBorderStyle = active
    ? "$space$px solid $borderAccent"
    : "$space$px solid $borderLight";
  return (
    <Flex
      onClick={onClick}
      css={{
        border: activeBorderStyle,
        p: "$4",
        r: "$2",
        w: "100%",
        cursor: "pointer",
      }}
      align="center"
    >
      <Flex
        css={{
          border: activeBorderStyle,
          p: "$4",
          bg: "$surfaceLight",
          c: "$textHighEmp",
          r: "$0",
        }}
      >
        {icon}
      </Flex>
      <Text variant="sub1" css={{ ml: "$md" }}>
        {title}
      </Text>
    </Flex>
  );
}

const AddMenu = ({ id, interactionType, onCreate }) => {
  const actions = useHMSActions();
  const [title, setTitle] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [error, setError] = useState();

  return (
    <Flex direction="column">
      <Text
        variant="body2"
        css={{ mb: "$4" }}
      >{`Name this ${interactionType.toLowerCase()}`}</Text>
      <Input
        type="text"
        value={title}
        onChange={event => setTitle(event.target.value)}
      />
      <Flex align="center" css={{ mt: "$10" }}>
        <Switch css={{ mr: "$6" }} />
        <Text variant="body2" css={{ c: "$textMedEmp" }}>
          Hide Vote Count
        </Text>
      </Flex>
      <Flex align="center" css={{ mt: "$10" }}>
        <Switch
          onCheckedChange={value => setAnonymous(value)}
          css={{ mr: "$6" }}
        />
        <Text variant="body2" css={{ c: "$textMedEmp" }}>
          Make Results Anonymous
        </Text>
      </Flex>
      <Flex align="center" css={{ mt: "$10" }}>
        <Switch onCheckedChange={() => {}} css={{ mr: "$6" }} />
        <Text variant="body2" css={{ c: "$textMedEmp" }}>
          Timer
        </Text>
      </Flex>

      <Button
        variant="primary"
        css={{ mt: "$10" }}
        onClick={async () => {
          await actions.interactivityCenter
            .createPoll({
              id,
              title,
              anonymous,
              type: interactionType.toLowerCase(),
            })
            .then(() => onCreate())
            .catch(err => setError(err.message));
        }}
      >
        {`Start ${interactionType}`}
      </Button>
      <ErrorText error={error} />
    </Flex>
  );
};

const PrevMenu = ({ interactions }) => {
  return (
    <Flex direction="column">
      <Text variant="h6" css={{ c: "$textHighEmp" }}>
        Previous Polls/Quiz
      </Text>
      {interactions?.map(interaction => (
        <InteractionCard {...interaction} />
      ))}
    </Flex>
  );
};

const InteractionCard = ({ title, active, timeLeft, onClick, css }) => {
  return (
    <Flex direction="column">
      <Flex css={{ w: "100%" }}>
        <Text
          variant="sub1"
          css={{ mt: "$md", c: "$textHighEmp", fontWeight: "$semiBold" }}
        >
          {title}
        </Text>
      </Flex>
      <Flex css={{ w: "100%", gap: "$4" }} justify="end">
        {active ? <Button variant="standard">View results</Button> : null}
        <Button variant="primary">View</Button>
      </Flex>
    </Flex>
  );
};

const interactionTypes = {
  Poll: {
    title: "Poll",
    icon: <StatsIcon width={32} height={32} />,
    onClick: () => {},
  },

  Quiz: {
    title: "Quiz",
    icon: <QuestionIcon width={32} height={32} />,
    onClick: () => {},
  },
};
