import React from "react";
import { Flex, Footer as AppFooter, Box } from "@100mslive/react-ui";
import { AudioVideoToggle } from "../AudioVideoToggle";
import { MoreSettings } from "../MoreSettings/MoreSettings";
import { ScreenshareToggle } from "../ScreenShare";
import { NoiseSuppression } from "../../plugins/NoiseSuppression";
import { ToggleWhiteboard } from "../../plugins/whiteboard";
import { VirtualBackground } from "../../plugins/VirtualBackground/VirtualBackground";
import PIPComponent from "../PIP/PIPComponent";
import { LeaveRoom } from "../LeaveRoom";
import GoLiveButton from "../GoLiveButton";
import MetaActions from "../MetaActions";
import { ChatToggle } from "./ChatToggle";
import { FeatureFlags } from "../../services/FeatureFlags";

const TranscriptionButton = React.lazy(() =>
  import("../../plugins/transcription")
);

export const StreamingFooter = () => {
  return (
    <AppFooter.Root
      css={{
        flexWrap: "nowrap",
        "@md": {
          justifyContent: "center",
        },
      }}
    >
      <AppFooter.Left
        css={{
          "@md": {
            w: "unset",
            p: "0",
          },
        }}
      >
        <AudioVideoToggle />
        {FeatureFlags.enableWhiteboard ? <ToggleWhiteboard /> : null}
        <VirtualBackground />
        <NoiseSuppression />
        {FeatureFlags.enableTranscription && <TranscriptionButton />}
      </AppFooter.Left>
      <AppFooter.Center
        css={{
          "@md": {
            w: "unset",
          },
        }}
      >
        <ScreenshareToggle css={{ mx: "$4", "@sm": { display: "none" } }} />
        <Box css={{ "@md": { display: "none" } }}>
          <PIPComponent />
        </Box>
        <GoLiveButton css={{ display: "none", "@sm": { display: "block" } }} />
        <MoreSettings />
        <Box css={{ "@md": { display: "none" } }}>
          <LeaveRoom isConference={false} />
        </Box>
        <Flex
          align="center"
          css={{ display: "none", "@md": { display: "flex" } }}
        >
          <ChatToggle />
        </Flex>
      </AppFooter.Center>
      <AppFooter.Right>
        <MetaActions />
        <ChatToggle />
      </AppFooter.Right>
    </AppFooter.Root>
  );
};
