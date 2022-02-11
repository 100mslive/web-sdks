// @ts-check
import React, { useRef, useState } from "react";
import { StyledVideoTile, Video, VideoTileStats } from "@100mslive/react-ui";
import {
  useHMSStore,
  selectPeerByID,
  selectScreenShareAudioByPeerID,
  selectScreenShareByPeerID,
} from "@100mslive/react-sdk";
import { ExpandIcon, ShrinkIcon } from "@100mslive/react-icons";
import { useFullscreen } from "react-use";
import TileMenu from "./TileMenu";
import { getVideoTileLabel } from "./peerTileUtils";

const Tile = ({
  peerId,
  showStatsOnTiles,
  width = "100%",
  height = "100%",
}) => {
  const track = useHMSStore(selectScreenShareByPeerID(peerId));
  const peer = useHMSStore(selectPeerByID(peerId));
  const [isMouseHovered, setIsMouseHovered] = useState(false);
  const label = getVideoTileLabel(peer, track);
  const fullscreenRef = useRef(null);
  // fullscreen is for desired state
  const [fullscreen, setFullscreen] = useState(false);
  // isFullscreen is for true state
  const isFullscreen = useFullscreen(fullscreenRef, fullscreen, {
    onClose: () => setFullscreen(false),
  });
  const audioTrack = useHMSStore(selectScreenShareAudioByPeerID(peer?.id));
  return (
    <StyledVideoTile.Root css={{ width, height }}>
      <StyledVideoTile.Container
        transparentBg
        ref={fullscreenRef}
        onMouseEnter={() => setIsMouseHovered(true)}
        onMouseLeave={() => {
          setIsMouseHovered(false);
        }}
      >
        {showStatsOnTiles ? (
          <VideoTileStats
            audioTrackID={audioTrack?.id}
            videoTrackID={track?.id}
          />
        ) : null}
        <StyledVideoTile.FullScreenButton
          onClick={() => setFullscreen(!fullscreen)}
        >
          {isFullscreen ? <ShrinkIcon /> : <ExpandIcon />}
        </StyledVideoTile.FullScreenButton>
        {track ? (
          <Video
            screenShare={true}
            mirror={peer.isLocal && track?.source === "regular"}
            trackId={track.id}
          />
        ) : null}
        <StyledVideoTile.Info>{label}</StyledVideoTile.Info>
        {isMouseHovered && !peer?.isLocal ? (
          <TileMenu
            isScreenshare
            peerID={peer?.id}
            audioTrackID={audioTrack?.id}
            videoTrackID={track?.id}
          />
        ) : null}
      </StyledVideoTile.Container>
    </StyledVideoTile.Root>
  );
};

const ScreenshareTile = React.memo(Tile);

export default ScreenshareTile;
