// @ts-check
import React, { useState } from "react";
import { QuizIcon } from "@100mslive/react-icons";
import { Flex, Text } from "@100mslive/react-ui";
import { LaunchPollsQuizMenu } from "../Polls/LaunchPollsQuizMenu";
import PollsQuizMenu from "../Polls/PollsQuizMenu";
import { Voting } from "../Polls/Voting";
import { Container, ContentHeader } from "../Streaming/Common";
import { useSidepaneToggle } from "../AppData/useSidepane";
import { useSetAppDataByKey } from "../AppData/useUISettings";
import { SIDE_PANE_OPTIONS } from "../../common/constants";

export const Widgets = () => {
  const [showWidgetState, setShowWidgetState] = useState("");
  const closeWidgets = useSidepaneToggle(SIDE_PANE_OPTIONS.WIDGET);
  const [id, setId] = useSetAppDataByKey("pollInView");

  return (
    <Container rounded>
      <ContentHeader content="Widgets" onBack={closeWidgets} />
      <Flex direction="column" css={{ p: "$10" }}>
        <Flex>
          {cardData.map(card => {
            return <WidgetCard {...card} />;
          })}
        </Flex>
        <Flex direction="column">
          <WidgetOptions
            title="Poll/Quiz"
            Icon={<QuizIcon width={40} height={40} />}
            subtitle="Find out what others think"
            onClick={() => setShowWidgetState("PollsQuizMenu")}
          />
        </Flex>
      </Flex>
      {showWidgetState === "PollsQuizMenu" && (
        <PollsQuizMenu
          onCreate={newID => {
            setId(newID);
            setShowWidgetState("QuestionMenu");
          }}
          onVote={newID => {
            setId(newID);
            setShowWidgetState("voting");
          }}
          onBack={() => setShowWidgetState("")}
        />
      )}
      {showWidgetState === "QuestionMenu" && (
        <LaunchPollsQuizMenu
          id={id}
          onStart={() => setShowWidgetState("voting")}
          onBack={() => setShowWidgetState("PollsQuizMenu")}
        />
      )}
      {showWidgetState === "voting" && <Voting id={id} />}
    </Container>
  );
};

const cardData = [
  {
    title: "Share Music",
    subtitle: "Play music from Spotify or any other tab",
    imageSrc: "",
    onClick: () => {},
  },
  {
    title: "Whiteboard",
    subtitle: "Collaboratively sketch ideas",
    imageSrc: "",
    onClick: () => {},
  },
];

const WidgetCard = ({ title, subtitle, imageSrc, onClick, css }) => {
  return (
    <Flex
      direction="column"
      css={{ cursor: "pointer", w: "100%", ...css }}
      onClick={onClick}
      key={title}
    >
      <Flex>
        <img src={imageSrc} alt={`${imageSrc}-polls`} />
      </Flex>
      <Text variant="sub2" css={{ mt: "$md", c: "$textHighEmp" }}>
        {title}
      </Text>
      <Text variant="caption" css={{ c: "$textMedEmp", mt: "$2" }}>
        {subtitle}
      </Text>
    </Flex>
  );
};

const WidgetOptions = ({ title, onClick, subtitle, Icon }) => {
  return (
    <Flex
      onClick={onClick}
      key={title}
      css={{ cursor: "pointer", "&:hover": { bg: "$surfaceLight", r: "$0" } }}
      align="center"
    >
      <Flex
        css={{
          border: "$space$px solid $borderLight",
          r: "$1",
          p: "$4",
          c: "$textHighEmp",
        }}
      >
        {Icon}
      </Flex>
      <Flex direction="column" css={{ ml: "$md" }}>
        <Text
          variant="sub2"
          css={{ c: "$textHighEmp", fontWeight: "$semiBold", mb: "$4" }}
        >
          {title}
        </Text>
        <Text variant="caption">{subtitle}</Text>
      </Flex>
    </Flex>
  );
};
