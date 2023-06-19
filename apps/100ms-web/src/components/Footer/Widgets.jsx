import React, { useRef, useState } from "react";
import { QuizIcon } from "@100mslive/react-icons";
import { Flex, Text } from "@100mslive/react-ui";
import { LaunchPollsQuizMenu } from "../Polls/LaunchPollsQuizMenu";
import PollsQuizMenu from "../Polls/PollsQuizMenu";
import { Container, ContentHeader } from "../Streaming/Common";
import { useSidepaneToggle } from "../AppData/useSidepane";
import { SIDE_PANE_OPTIONS } from "../../common/constants";

export const Widgets = () => {
  const [showWidgetState, setShowWidgetState] = useState("PollsQuizMenu");
  const closeWidgets = useSidepaneToggle(SIDE_PANE_OPTIONS.WIDGET);
  const id = useRef(Date.now().toString());

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
            launchQuestions={() => setShowWidgetState("QuestionMenu")}
          />
        </Flex>
      </Flex>
      {showWidgetState === "PollsQuizMenu" && (
        <PollsQuizMenu
          id={id.current}
          launchQuestions={() => setShowWidgetState("QuestionMenu")}
          onBack={() => setShowWidgetState("")}
        />
      )}
      {showWidgetState === "QuestionMenu" && (
        <LaunchPollsQuizMenu
          id={id.current}
          onBack={() => setShowWidgetState("PollsQuizMenu")}
        />
      )}
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
