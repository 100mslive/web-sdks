import React from "react";
import { Flex, Box } from "@100mslive/react-ui";
import { ParticipantCount } from "./ParticipantList";
import { LeaveRoom } from "../LeaveRoom";
import MetaActions from "../MetaActions";
import { Logo, SpeakerTag } from "./HeaderComponents";
import { StreamActions } from "./StreamActions";

export const StreamingHeader = ({ isPreview }) => {
  return (
    <Flex
      justify="between"
      align="center"
      css={{ position: "relative", height: "100%" }}
    >
      <Flex align="center" css={{ position: "absolute", left: "$10" }}>
        <Logo />
        <Box css={{ display: "none", "@md": { display: "block" } }}>
          <LeaveRoom />
        </Box>
        {!isPreview ? <SpeakerTag /> : null}
      </Flex>

      <Flex align="center" css={{ position: "absolute", right: "$10" }}>
        <Box css={{ display: "none", "@md": { display: "block" } }}>
          <MetaActions compact />
        </Box>
        <StreamActions />
        <Box css={{ mx: "$2" }}>
          <ParticipantCount />
        </Box>
      </Flex>
    </Flex>
  );
};
