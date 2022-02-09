import React, { useRef, useState } from "react";
import {
  StyledVideoTile,
  styled,
  Video,
  VideoTileStats,
} from "@100mslive/react-ui";
import {
  useHMSStore,
  selectPeerByID,
  selectTrackByID,
} from "@100mslive/react-sdk";
import { ExpandIcon, ShrinkIcon } from "@100mslive/react-icons";
import { useFullscreen, useToggle } from "react-use";
import { HmsTileMenu } from "../UIComponents";
import { getVideoTileLabel } from "./utils";

const HmsScreenshareTile = ({ trackId, showStatsOnTiles, width, height }) => {
  const track = useHMSStore(selectTrackByID(trackId));
  const peer = useHMSStore(selectPeerByID(track?.peerId));
  const [showTrigger, setShowTrigger] = useState(false);
  const label = getVideoTileLabel(
    peer?.name,
    peer?.isLocal,
    track?.source,
    track?.degraded
  );
  const ref = useRef(null);
  const [show, toggle] = useToggle(false);
  const isFullscreen = useFullscreen(ref, show, {
    onClose: () => toggle(false),
  });
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

          <FullScreenButton onClick={() => toggle()}>
            {isFullscreen ? <ShrinkIcon /> : <ExpandIcon />}
          </FullScreenButton>
          {track ? (
            <Video
              screenShare={true}
              mirror={peer.isLocal && track?.source === "regular"}
              trackId={track.id}
            />
          ) : null}

          <StyledVideoTile.Info>{label}</StyledVideoTile.Info>
          {showTrigger && !peer?.isLocal ? (
            <HmsTileMenu peerId={track.peerId} />
          ) : null}
        </StyledVideoTile.Container>
      ) : null}
    </StyledVideoTile.Root>
  );
};

export default HmsScreenshareTile;

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
