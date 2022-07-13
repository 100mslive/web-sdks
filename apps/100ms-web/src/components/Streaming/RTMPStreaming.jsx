import { SettingsIcon } from "@100mslive/react-icons";
import React from "react";
import { Container, ContentBody, ContentHeader } from "./Common";

const RTMPStreaming = ({ onBack }) => {
  return (
    <Container>
      <ContentHeader
        title="Start Streaming"
        content="Choose a destination"
        onBack={onBack}
      />
      <ContentBody Icon={SettingsIcon} title="Custom RTMP">
        Allows you to add a Custom RTMP or more than 1 channel of the same
        platform from our list of supported platforms.
      </ContentBody>
    </Container>
  );
};

export { RTMPStreaming };
