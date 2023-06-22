// @ts-check
import React, { useState } from "react";
import { selectPolls, useHMSActions, useHMSStore } from "@100mslive/react-sdk";
import { QuestionIcon, StatsIcon } from "@100mslive/react-icons";
import { Button, Flex, Input, Switch, Text } from "@100mslive/react-ui";
import { Container, ContentHeader, ErrorText } from "../Streaming/Common";

const PollsQuizMenu = ({ onCreate, onVote, onBack }) => {
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
        <AddMenu interactionType={interactionType} onCreate={onCreate} />

        <Flex
          css={{
            borderTop: "$space$px solid $borderLight",
            mt: "$10",
            pt: "$10",
          }}
        >
          <PrevMenu onVote={onVote} />
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

const AddMenu = ({ interactionType, onCreate }) => {
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
          const id = Date.now().toString();
          await actions.interactivityCenter
            .createPoll({
              id,
              title,
              anonymous,
              type: interactionType.toLowerCase(),
            })
            .then(() => onCreate(id))
            .catch(err => setError(err.message));
        }}
      >
        {`Start ${interactionType}`}
      </Button>
      <ErrorText error={error} />
    </Flex>
  );
};

const PrevMenu = ({ onVote }) => {
  const polls = useHMSStore(selectPolls);
  return polls?.length ? (
    <Flex direction="column">
      <Text variant="h6" css={{ c: "$textHighEmp" }}>
        Previous Polls/Quiz
      </Text>
      {polls.map(poll => (
        <InteractionCard {...poll} onVote={onVote} />
      ))}
    </Flex>
  ) : null;
};

const InteractionCard = ({ id, title, state, onVote }) => {
  const ended = state === "stopped";
  return (
    <Flex direction="column">
      <Flex css={{ w: "100%", justifyContent: "space-between" }}>
        <Text
          variant="sub1"
          css={{ mt: "$md", c: "$textHighEmp", fontWeight: "$semiBold" }}
        >
          {title}
        </Text>
        {/* <Text
          css={{
            bg: ended ? "$surfaceLighter" : "$error",
            p: "$2 $4",
            fontWeight: "$semiBold",
            fontSize: "$xs",
            r: "$1",
          }}
        >
          {ended ? "ENDED" : "LIVE"}
        </Text> */}
      </Flex>
      <Flex css={{ w: "100%", gap: "$4" }} justify="end">
        <Button variant="standard">View results</Button>
        {!ended && (
          <Button variant="primary" onClick={() => onVote(id)}>
            View
          </Button>
        )}
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
