import React from "react";
import { ChatIcon, ChatUnreadIcon } from "@100mslive/react-icons";
import {
  selectUnreadHMSMessagesCount,
  useHMSStore,
} from "@100mslive/react-sdk";
import { Flex, Tooltip, Footer as AppFooter, Box } from "@100mslive/react-ui";
import { AudioVideoToggle } from "../AudioVideoToggle";
import { MoreSettings } from "../MoreSettings/MoreSettings";
import { ScreenshareToggle } from "../ScreenShare";
import { NoiseSuppression } from "../../plugins/NoiseSuppression";
import { ToggleWhiteboard } from "../../plugins/whiteboard";
import { VirtualBackground } from "../../plugins/VirtualBackground/VirtualBackground";
import {
  useIsSidepaneTypeOpen,
  useSidepaneToggle,
} from "../AppData/useSidepane";
import { FeatureFlags } from "../../services/FeatureFlags";
import { SIDE_PANE_OPTIONS } from "../../common/constants";
import IconButton from "../../IconButton";
import PIPComponent from "../PIP/PIPComponent";
import { LeaveRoom } from "../LeaveRoom";
import GoLiveButton from "../GoLiveButton";
import MetaActions from "../MetaActions";

const TranscriptionButton = React.lazy(() =>
  import("../../plugins/transcription")
);

const Chat = () => {
  const countUnreadMessages = useHMSStore(selectUnreadHMSMessagesCount);
  const isChatOpen = useIsSidepaneTypeOpen(SIDE_PANE_OPTIONS.CHAT);
  const toggleChat = useSidepaneToggle(SIDE_PANE_OPTIONS.CHAT);

  return (
    <Tooltip key="chat" title={`${isChatOpen ? "Close" : "Open"} chat`}>
      <IconButton
        css={{ mx: "$4" }}
        onClick={toggleChat}
        active={!isChatOpen}
        data-testid="chat_btn"
      >
        {countUnreadMessages === 0 ? (
          <ChatIcon />
        ) : (
          <ChatUnreadIcon data-testid="chat_unread_btn" />
        )}
      </IconButton>
    </Tooltip>
  );
};

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
        <GoLiveButton
          css={{ display: "none", height: "$13", "@sm": { display: "block" } }}
        />
        <MoreSettings />
        <Box css={{ "@md": { display: "none" } }}>
          <LeaveRoom />
        </Box>
        <Flex
          align="center"
          css={{ display: "none", "@md": { display: "flex" } }}
        >
          <Chat />
        </Flex>
      </AppFooter.Center>
      <AppFooter.Right>
        <MetaActions />
        <Chat />
      </AppFooter.Right>
    </AppFooter.Root>
  );
};
