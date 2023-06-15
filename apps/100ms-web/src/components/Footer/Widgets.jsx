import React, { useState } from "react";
import { Flex, Text } from "@100mslive/react-ui";
import { PollsQuizMenu } from "../Polls/PollsQuizMenu";
import { Container, ContentHeader } from "../Streaming/Common";

export const Widgets = () => {
  const [showPollQuiz, setShowPollQuiz] = useState(false);
  return (
    <Container rounded>
      <ContentHeader content="Widgets" />
      <Flex direction="column" css={{ p: "$10" }}>
        <Flex>
          {cardData.map(card => {
            return <WidgetCard {...card} />;
          })}
        </Flex>
        <Flex direction="column">
          <WidgetOptions
            title="Poll/Quiz"
            subtitle="Find out what others think"
            onClick={() => setShowPollQuiz(true)}
          />
        </Flex>
      </Flex>
      {showPollQuiz && <PollsQuizMenu />}
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
      css={{ cursor: "pointer", ...css }}
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
    <Flex onClick={onClick} key={title} css={{ cursor: "pointer" }}>
      <Flex>{Icon}</Flex>
      <Flex direction="column">
        <Text variant="sub2">{title}</Text>
        <Text variant="sub2">{subtitle}</Text>
      </Flex>
    </Flex>
  );
};
