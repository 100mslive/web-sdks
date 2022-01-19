import React, { useState } from "react";
import {
  AudioLevel,
  Avatar,
  StyledVideoTile,
  TileMenu,
  Video,
  VideoTileStats,
} from "@100mslive/react-ui";
import {
  useHMSStore,
  selectIsPeerAudioEnabled,
  selectIsPeerVideoEnabled,
  selectPeerByID,
  selectPeerMetadata,
} from "@100mslive/react-sdk";
import {
  MicOffIcon,
  HandRaiseFilledIcon,
  BrbIcon,
} from "@100mslive/react-icons";

const VideoTile = ({ peerId, width, height, showStatsOnTiles }) => {
  const peer = useHMSStore(selectPeerByID(peerId));
  const isAudioMuted = !useHMSStore(selectIsPeerAudioEnabled(peerId));
  const isVideoMuted = !useHMSStore(selectIsPeerVideoEnabled(peerId));
  const [showTrigger, setShowTrigger] = useState(false);
  const isHandRaised =
    useHMSStore(selectPeerMetadata(peerId))?.isHandRaised || false;
  const isBRB = useHMSStore(selectPeerMetadata(peerId))?.isBRB || false;
  return (
    <StyledVideoTile.Root
      css={{ width, height }}
      onMouseEnter={() => setShowTrigger(true)}
      onMouseLeave={() => {
        setShowTrigger(false);
      }}
    >
      <StyledVideoTile.Container>
        {showStatsOnTiles ? (
          <VideoTileStats
            height={height}
            audioTrackID={peer?.audioTrack}
            videoTrackID={peer?.videoTrack}
          />
        ) : null}
        <AudioLevel audioTrack={peer?.audioTrack} />
        <Video isLocal={peer?.isLocal || false} trackId={peer?.videoTrack} />
        {isVideoMuted ? (
          <Avatar size={getAvatarSize(width)} name={peer?.name || ""} />
        ) : null}
        <StyledVideoTile.Info>{peer?.name}</StyledVideoTile.Info>
        {isAudioMuted ? (
          <StyledVideoTile.AudioIndicator>
            <MicOffIcon />
          </StyledVideoTile.AudioIndicator>
        ) : null}
        {showTrigger && !peer?.isLocal ? <TileMenu peerId={peerId} /> : null}

        {isHandRaised ? (
          <StyledVideoTile.HandRaiseBox>
            <HandRaiseFilledIcon width={40} height={40} />
          </StyledVideoTile.HandRaiseBox>
        ) : null}
        {isBRB ? (
          <StyledVideoTile.HandRaiseBox css={{ c: "white" }}>
            <BrbIcon width={40} height={40} />
          </StyledVideoTile.HandRaiseBox>
        ) : null}
      </StyledVideoTile.Container>
    </StyledVideoTile.Root>
  );
};

export default VideoTile;

const getAvatarSize = width => {
  if (width < 200) {
    return "xs";
  } else if (width < 500) {
    return "sm";
  } else {
    return "md";
  }
};
