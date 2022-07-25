import React from "react";
import { useMedia } from "react-use";
import { Flex, Box, config as cssConfig } from "@100mslive/react-ui";
import { ParticipantCount } from "./ParticipantList";
import { LeaveRoom } from "../LeaveRoom";
import MetaActions from "../MetaActions";
import { Logo, SpeakerTag } from "./HeaderComponents";
import { LiveStatus, RecordingStatus, StreamActions } from "./StreamActions";

export const StreamingHeader = ({ isPreview }) => {
  const isMobile = useMedia(cssConfig.media.md);
  return (
    <Flex
      justify="between"
      align="center"
      css={{ position: "relative", height: "100%" }}
    >
      <Flex
        align="center"
        css={{
          position: "absolute",
          left: "$10",
        }}
      >
        <Logo />
        {isMobile && (
          <Flex align="center" gap={2}>
            <LeaveRoom />
            <LiveStatus />
            <RecordingStatus />
          </Flex>
        )}
        {!isPreview ? <SpeakerTag /> : null}
      </Flex>

      <Flex
        align="center"
        css={{
          position: "absolute",
          right: "$10",
          gap: "$4",
          "@md": { gap: "$2" },
        }}
      >
        {isMobile ? (
          <Box>
            <MetaActions compact />
          </Box>
        ) : (
          <Flex css={{ gap: "$4" }}>
            <StreamActions />
          </Flex>
        )}
        <ParticipantCount />
      </Flex>
    </Flex>
  );
};
