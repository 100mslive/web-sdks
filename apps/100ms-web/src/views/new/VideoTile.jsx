import React, { useRef, useState } from "react";
import {
  AudioLevel,
  Avatar,
  StyledVideoTile,
  styled,
  Video,
  VideoTileStats,
} from "@100mslive/react-ui";
import {
  useHMSStore,
  selectIsPeerAudioEnabled,
  selectIsPeerVideoEnabled,
  selectPeerByID,
  selectPeerMetadata,
  selectIsAudioLocallyMuted,
  selectTrackByID,
} from "@100mslive/react-sdk";
import {
  MicOffIcon,
  HandRaiseFilledIcon,
  BrbIcon,
  ExpandIcon,
  ShrinkIcon,
} from "@100mslive/react-icons";
import { useFullscreen, useToggle } from "react-use";
import { HmsTileMenu } from "../UIComponents";

const HmsVideoTile = ({ trackId, showStatsOnTiles, width, height }) => {
  const track = useHMSStore(selectTrackByID(trackId));
  const isScreenShare = track.source === "screen";
  const peer = useHMSStore(selectPeerByID(track.peerId));
  const isAudioMuted = !useHMSStore(selectIsPeerAudioEnabled(track.peerId));
  const isVideoMuted = !useHMSStore(selectIsPeerVideoEnabled(track.peerId));
  const [showTrigger, setShowTrigger] = useState(false);
  const isHandRaised =
    useHMSStore(selectPeerMetadata(track.peerId))?.isHandRaised || false;
  const isBRB = useHMSStore(selectPeerMetadata(track.peerId))?.isBRBOn || false;
  const isLocallyMuted = useHMSStore(
    selectIsAudioLocallyMuted(peer.audioTrack)
  );
  const label = getVideoTileLabel(
    peer.name,
    peer.isLocal,
    track?.source,
    isLocallyMuted,
    track?.degraded
  );
  const ref = useRef(null);
  const [show, toggle] = useToggle(false);
  const isFullscreen = useFullscreen(ref, show, {
    onClose: () => toggle(false),
  });
  return (
    <StyledVideoTile.Root css={{ width, height }}>
      <StyledVideoTile.Container
        ref={ref}
        onMouseEnter={() => setShowTrigger(true)}
        onMouseLeave={() => {
          setShowTrigger(false);
        }}
      >
        {showStatsOnTiles ? (
          <VideoTileStats
            audioTrackID={peer?.audioTrack}
            videoTrackID={track.id}
          />
        ) : null}
        {isScreenShare ? (
          <FullScreenButton onClick={() => toggle()}>
            {isFullscreen ? <ShrinkIcon /> : <ExpandIcon />}
          </FullScreenButton>
        ) : null}
        <AudioLevel audioTrack={peer?.audioTrack} />
        {track ? (
          <Video
            screenShare={isScreenShare}
            mirror={peer.isLocal && track?.source === "regular"}
            trackId={track.id}
          />
        ) : null}
        {isVideoMuted && !isScreenShare ? (
          <Avatar size={getAvatarSize(height)} name={peer?.name || ""} />
        ) : null}
        <StyledVideoTile.Info>{label}</StyledVideoTile.Info>
        {isAudioMuted && !isScreenShare ? (
          <StyledVideoTile.AudioIndicator>
            <MicOffIcon />
          </StyledVideoTile.AudioIndicator>
        ) : null}
        {showTrigger && !peer?.isLocal ? (
          <HmsTileMenu peerId={track.peerId} />
        ) : null}
        {isHandRaised ? (
          <StyledVideoTile.AttributeBox>
            <HandRaiseFilledIcon width={40} height={40} />
          </StyledVideoTile.AttributeBox>
        ) : null}
        {isBRB ? (
          <StyledVideoTile.AttributeBox>
            <BrbIcon width={40} height={40} />
          </StyledVideoTile.AttributeBox>
        ) : null}
      </StyledVideoTile.Container>
    </StyledVideoTile.Root>
  );
};

export default HmsVideoTile;

const getAvatarSize = height => {
  if (height === "100%") {
    return "sm";
  }
  if (height < 200) {
    return "xs";
  } else if (height < 500) {
    return "sm";
  } else {
    return "md";
  }
};

const PEER_NAME_PLACEHOLDER = "peerName";
const labelMap = new Map([
  [[true, "screen"].toString(), "Your Screen"],
  [[true, "playlist"].toString(), "Your Playlist"],
  [[true, "regular"].toString(), `You (${PEER_NAME_PLACEHOLDER})`],
  [[false, "screen"].toString(), `${PEER_NAME_PLACEHOLDER}'s Screen`],
  [[false, "playlist"].toString(), `${PEER_NAME_PLACEHOLDER}'s Video`],
  [[false, "regular"].toString(), PEER_NAME_PLACEHOLDER],
  [[false, undefined].toString(), PEER_NAME_PLACEHOLDER],
]);

export const getVideoTileLabel = (
  peerName,
  isLocal,
  videoSource = "regular",
  isLocallyMuted,
  degraded
) => {
  // Map [isLocal, videoSource] to the label to be displayed.

  let label = labelMap
    .get([isLocal, videoSource].toString())
    .replace(PEER_NAME_PLACEHOLDER, peerName);
  label = `${label}${degraded ? "(Degraded)" : ""}`;
  if (
    (isLocallyMuted === undefined || isLocallyMuted === null) &&
    videoSource === "regular"
  ) {
    return label;
  }
  return `${label}${isLocallyMuted ? " (Muted for you)" : ""}`;
};

const FullScreenButton = styled("button", {
  width: "2.25rem",
  height: "2.25rem",
  color: "white",
  borderRadius: "$round",
  backgroundColor: "$menuBg",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  position: "absolute",
  bottom: "1rem",
  right: "1rem",
  zIndex: 20,
  "&:not([disabled]):focus": {
    outline: "none",
    boxShadow: "0 0 0 3px $colors$brandTint",
  },
});
