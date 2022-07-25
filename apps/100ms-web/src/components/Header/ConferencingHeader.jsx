import React from "react";
import { Flex, VerticalDivider } from "@100mslive/react-ui";
import { ParticipantCount } from "./ParticipantList";
import { Logo, SpeakerTag } from "./HeaderComponents";
import { AdditionalRoomState } from "./AdditionalRoomState";
import { RecordingStreaming } from "./RecordingAndRTMPModal";
import { Fragment } from "typedoc/dist/lib/utils";

export const ConferencingHeader = ({ isPreview }) => {
  return (
    <Flex
      justify="between"
      align="center"
      css={{ position: "relative", height: "100%" }}
    >
      <Flex align="center" css={{ position: "absolute", left: "$10" }}>
        <Logo />
        {!isPreview ? (
          <Fragment>
            <VerticalDivider css={{ ml: "$8" }} />
            <SpeakerTag />
          </Fragment>
        ) : null}
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
        <RecordingStreaming />
        <AdditionalRoomState />
        <ParticipantCount />
      </Flex>
    </Flex>
  );
};
