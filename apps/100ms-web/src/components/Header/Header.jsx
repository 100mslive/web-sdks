import React, { useContext } from "react";
import {
  useHMSStore,
  selectDominantSpeaker,
  selectLocalPeerRoleName,
  selectIsConnectedToRoom,
  selectIsAllowedToPublish,
} from "@100mslive/react-sdk";
import { SpeakerIcon, GoLiveIcon } from "@100mslive/react-icons";
import {
  Flex,
  Text,
  textEllipsis,
  Box,
  styled,
  Button,
} from "@100mslive/react-ui";
import { ParticipantList } from "./ParticipantList";
import { AdditionalRoomState } from "./AdditionalRoomState";
import PIPComponent from "../PIP/PIPComponent";
import { AppContext } from "../context/AppContext";
import { useSidepaneToggle } from "../AppData/useSidepane";
import {
  DEFAULT_HLS_VIEWER_ROLE,
  SIDE_PANE_OPTIONS,
} from "../../common/constants";

const SpeakerTag = () => {
  const dominantSpeaker = useHMSStore(selectDominantSpeaker);
  return dominantSpeaker && dominantSpeaker.name ? (
    <Flex
      align="center"
      justify="center"
      css={{ flex: "1 1 0", color: "$textPrimary", "@md": { display: "none" } }}
    >
      <SpeakerIcon width={24} height={24} />
      <Text
        variant="md"
        css={{ ...textEllipsis(200), ml: "$2" }}
        title={dominantSpeaker.name}
      >
        {dominantSpeaker.name}
      </Text>
    </Flex>
  ) : (
    <></>
  );
};

const LogoImg = styled("img", {
  maxHeight: "$14",
  p: "$2",
  w: "auto",
  "@md": {
    maxHeight: "$12",
  },
});

const Logo = () => {
  const { logo } = useContext(AppContext);
  return <LogoImg src={logo} alt="Brand Logo" width={132} height={40} />;
};

const GoLive = () => {
  const toggleStreaming = useSidepaneToggle(SIDE_PANE_OPTIONS.STREAMING);
  const isConnected = useHMSStore(selectIsConnectedToRoom);
  const isAllowedToPublish = useHMSStore(selectIsAllowedToPublish);
  const isPublishingAnything = Object.values(isAllowedToPublish).some(
    value => !!value
  );
  if (!isConnected || !isPublishingAnything) {
    return null;
  }
  return (
    <Button variant="standard" onClick={toggleStreaming} css={{ mx: "$2" }}>
      <GoLiveIcon />
      <Text css={{ mx: "$2" }}>Go Live</Text>
    </Button>
  );
};

export const Header = ({ isPreview }) => {
  const localPeerRole = useHMSStore(selectLocalPeerRoleName);
  const showPip = localPeerRole !== DEFAULT_HLS_VIEWER_ROLE && !isPreview;
  return (
    <Flex
      justify="between"
      align="center"
      css={{ position: "relative", height: "100%" }}
    >
      <Flex align="center" css={{ position: "absolute", left: "$4" }}>
        <Logo />
      </Flex>
      <SpeakerTag />
      <Flex align="center" css={{ position: "absolute", right: "$4" }}>
        {showPip && <PIPComponent />}
        <AdditionalRoomState />
        <GoLive />
        <Box css={{ mx: "$2" }}>
          <ParticipantList />
        </Box>
      </Flex>
    </Flex>
  );
};
