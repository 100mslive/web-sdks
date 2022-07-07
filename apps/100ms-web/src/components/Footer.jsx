import React, { Fragment, useState } from "react";
import {
  BrbIcon,
  ChatIcon,
  ChatUnreadIcon,
  HandIcon,
  MusicIcon,
} from "@100mslive/react-icons";
import {
  HMSPlaylistType,
  selectUnreadHMSMessagesCount,
  selectIsAllowedToPublish,
  useHMSStore,
  useScreenShare,
} from "@100mslive/react-sdk";
import { Flex, Tooltip, Footer as AppFooter, Box } from "@100mslive/react-ui";
import { AudioVideoToggle } from "./AudioVideoToggle";
import { LeaveRoom } from "./LeaveRoom";
import { MoreSettings } from "./MoreSettings/MoreSettings";
import { ScreenshareToggle } from "./ScreenShare";
import { ScreenShareHintModal } from "./ScreenshareHintModal";
import { Playlist } from "../components/Playlist/Playlist";
import { NoiseSuppression } from "../plugins/NoiseSuppression";
import { ToggleWhiteboard } from "../plugins/whiteboard";
import { VirtualBackground } from "../plugins/VirtualBackground/VirtualBackground";
import { useMyMetadata } from "./hooks/useMetadata";
import {
  useIsSidepaneTypeOpen,
  useSidepaneToggle,
} from "./AppData/useSidepane";
import { FeatureFlags } from "../services/FeatureFlags";
import { isScreenshareSupported } from "../common/utils";
import { SIDE_PANE_OPTIONS } from "../common/constants";
import IconButton from "../IconButton";
import PIPComponent from "./PIP/PIPComponent";

const TranscriptionButton = React.lazy(() =>
  import("../plugins/transcription")
);

const ScreenshareAudio = () => {
  const {
    amIScreenSharing,
    screenShareVideoTrackId: video,
    screenShareAudioTrackId: audio,
    toggleScreenShare,
  } = useScreenShare();
  const isAllowedToPublish = useHMSStore(selectIsAllowedToPublish);
  const isAudioScreenshare = amIScreenSharing && !video && !!audio;
  const [showModal, setShowModal] = useState(false);
  if (!isAllowedToPublish.screen || !isScreenshareSupported()) {
    return null;
  }
  return (
    <Fragment>
      <Tooltip
        title={`${!isAudioScreenshare ? "Start" : "Stop"} audio sharing`}
        key="shareAudio"
      >
        <IconButton
          active={!isAudioScreenshare}
          css={{ mr: "$4" }}
          onClick={() => {
            if (amIScreenSharing) {
              toggleScreenShare(true);
            } else {
              setShowModal(true);
            }
          }}
          data-testid="screenshare_audio"
        >
          <MusicIcon />
        </IconButton>
      </Tooltip>
      {showModal && (
        <ScreenShareHintModal onClose={() => setShowModal(false)} />
      )}
    </Fragment>
  );
};

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

export const Footer = () => {
  return (
    <AppFooter.Root>
      <AppFooter.Left>
        <ScreenshareAudio />
        <Playlist type={HMSPlaylistType.audio} />
        <Playlist type={HMSPlaylistType.video} />
        {FeatureFlags.enableWhiteboard ? <ToggleWhiteboard /> : null}
        <VirtualBackground />
        <NoiseSuppression />
        {FeatureFlags.enableTranscription && <TranscriptionButton />}
        <Flex
          align="center"
          css={{
            display: "none",
            "@md": {
              display: "flex",
            },
          }}
        >
          <MetaActions isMobile />
        </Flex>
      </AppFooter.Left>
      <AppFooter.Center>
        <AudioVideoToggle />
        <ScreenshareToggle css={{ mx: "$4" }} />
        <PIPComponent />
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
