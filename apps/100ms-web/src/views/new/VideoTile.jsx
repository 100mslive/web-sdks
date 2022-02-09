import React, { useRef, useState } from "react";
import {
  AudioLevel,
  Avatar,
  StyledVideoTile,
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
} from "@100mslive/react-icons";
import { HmsTileMenu } from "../UIComponents";
import { getVideoTileLabel } from "./utils";

const HmsVideoTile = ({ trackId, showStatsOnTiles, width, height }) => {
  const track = useHMSStore(selectTrackByID(trackId));
  const peer = useHMSStore(selectPeerByID(track?.peerId));
  const isAudioMuted = !useHMSStore(selectIsPeerAudioEnabled(track?.peerId));
  const isVideoMuted = !useHMSStore(selectIsPeerVideoEnabled(track?.peerId));
  const [showTrigger, setShowTrigger] = useState(false);
  const metaData = useHMSStore(selectPeerMetadata(track?.peerId));
  const isHandRaised = metaData?.isHandRaised || false;
  const isBRB = metaData?.isBRBOn || false;
  const isLocallyMuted = useHMSStore(
    selectIsAudioLocallyMuted(peer?.audioTrack)
  );
  const label = getVideoTileLabel(
    peer?.name,
    peer?.isLocal,
    track?.source,
    isLocallyMuted,
    track?.degraded
  );
  const ref = useRef(null);
  return (
    <StyledVideoTile.Root css={{ width, height }}>
      {peer ? (
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
              videoTrackID={track?.id}
            />
          ) : null}

          <AudioLevel audioTrack={peer?.audioTrack} />
          {track ? (
            <Video
              mirror={peer.isLocal && track?.source === "regular"}
              trackId={track.id}
            />
          ) : null}
          {isVideoMuted ? (
            <Avatar size={getAvatarSize(height)} name={peer?.name || ""} />
          ) : null}
          <StyledVideoTile.Info>{label}</StyledVideoTile.Info>
          {isAudioMuted ? (
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
      ) : null}
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
