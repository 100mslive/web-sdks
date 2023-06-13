import React from "react";
import { Flex, Text } from "@100mslive/react-ui";
import { Container, ContentBody, ContentHeader } from "../Streaming/Common";

const Widgets = () => {
  return (
    <Container rounded>
      <ContentHeader title="" content="Widgets" />
      <Flex>
        {cardData.map(card => {
          return <WidgetCard {...card} />;
        })}
      </Flex>
      <Flex></Flex>
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

const optionsData = [
  {
    title: "Poll/Quiz",
    subtitle: "Find out what others think",
    Icon: "",
    onClick: () => {},
  },
  {
    title: "Audio Playlist",
    subtitle:
      "Play music from Spotify or any other tabPlay audios from select collection",
    Icon: "",
    onClick: () => {},
  },
  {
    title: "Video Playlist",
    subtitle: "Play videos from select collection",
    Icon: "",
    onClick: () => {},
  },
];

const WidgetCard = ({ title, subtitle, imageSrc, onClick, css }) => {
  return (
    <Flex
      direction="column"
      css={{ cursor: "pointer", ...css }}
      onClick={onClick}
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

const WidgetOptions = (title, onClick, subtitle, Icon) => {
  return (
    <Flex onClick={onClick}>
      <Flex>
        <Icon />
      </Flex>
      <Flex direction="column">
        <Text variant="sub2">{title}</Text>
        <Text variant="sub2">{subtitle}</Text>
      </Flex>
    </Flex>
  );
};
