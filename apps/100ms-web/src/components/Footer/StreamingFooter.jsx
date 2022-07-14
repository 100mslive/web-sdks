import React from "react";
import {
  BrbIcon,
  ChatIcon,
  ChatUnreadIcon,
  HandIcon,
} from "@100mslive/react-icons";
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
import { useMyMetadata } from "../hooks/useMetadata";
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

const TranscriptionButton = React.lazy(() =>
  import("../../plugins/transcription")
);

export const MetaActions = ({ isMobile = false }) => {
  const { isHandRaised, isBRBOn, toggleHandRaise, toggleBRB } = useMyMetadata();

  return (
    <Flex align="center">
      <Tooltip title={`${!isHandRaised ? "Raise" : "Unraise"} hand`}>
        <IconButton
          css={{ mx: "$4" }}
          onClick={toggleHandRaise}
          active={!isHandRaised}
          data-testid={`${
            isMobile ? "raise_hand_btn_mobile" : "raise_hand_btn"
          }`}
        >
          <HandIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title={`${isBRBOn ? `I'm back` : `I'll be right back`}`}>
        <IconButton
          css={{ mx: "$4" }}
          onClick={toggleBRB}
          active={!isBRBOn}
          data-testid="brb_btn"
        >
          <BrbIcon />
        </IconButton>
      </Tooltip>
    </Flex>
  );
};

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
    <AppFooter.Root css={{ flexWrap: "nowrap" }}>
      <AppFooter.Left>
        <AudioVideoToggle />
        {FeatureFlags.enableWhiteboard ? <ToggleWhiteboard /> : null}
        <VirtualBackground />
        <NoiseSuppression />
        {FeatureFlags.enableTranscription && <TranscriptionButton />}
      </AppFooter.Left>
      <AppFooter.Center>
        <ScreenshareToggle css={{ mx: "$4", "@sm": { display: "none" } }} />
        <PIPComponent />
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
