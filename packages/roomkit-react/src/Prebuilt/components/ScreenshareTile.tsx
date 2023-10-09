import React, { useRef, useState } from 'react';
import { useFullscreen } from 'react-use';
import screenfull from 'screenfull';
import {
  selectLocalPeerID,
  selectPeerByID,
  selectScreenShareAudioByPeerID,
  selectScreenShareByPeerID,
  useHMSStore,
} from '@100mslive/react-sdk';
import { ExpandIcon, ShrinkIcon } from '@100mslive/react-icons';
// @ts-ignore: No implicit Any
import TileMenu from './TileMenu/TileMenu';
import { VideoTileStats } from '../../Stats';
import { Video } from '../../Video';
// @ts-ignore: No implicit Any
import { StyledVideoTile } from '../../VideoTile';
// @ts-ignore: No implicit Any
import { getVideoTileLabel } from './peerTileUtils';
// @ts-ignore: No implicit Any
import { ScreenshareDisplay } from './ScreenshareDisplay';
// @ts-ignore: No implicit Any
import { useUISettings } from './AppData/useUISettings';
// @ts-ignore: No implicit Any
import { UI_SETTINGS } from '../common/constants';

const labelStyles = {
  position: 'unset',
  width: '100%',
  textAlign: 'center',
  c: '$on_surface_high',
  transform: 'none',
  flexShrink: 0,
};

const Tile = ({
  peerId,
  width = '100%',
  height = 'max-content',
}: {
  peerId: string;
  width?: string | number;
  height?: string | number;
}) => {
  const isLocal = useHMSStore(selectLocalPeerID) === peerId;
  const track = useHMSStore(selectScreenShareByPeerID(peerId));
  const peer = useHMSStore(selectPeerByID(peerId));
  const isAudioOnly = useUISettings(UI_SETTINGS.isAudioOnly);
  const [isMouseHovered, setIsMouseHovered] = useState(false);
  const showStatsOnTiles = useUISettings(UI_SETTINGS.showStatsOnTiles);
  const fullscreenRef = useRef(null);
  // fullscreen is for desired state
  const [fullscreen, setFullscreen] = useState(false);
  // isFullscreen is for true state
  const isFullscreen = useFullscreen(fullscreenRef, fullscreen, {
    onClose: () => setFullscreen(false),
  });
  const isFullScreenSupported = screenfull.isEnabled;
  const audioTrack = useHMSStore(selectScreenShareAudioByPeerID(peer?.id));

  if (isLocal && track?.displaySurface && !['browser', 'window', 'application'].includes(track.displaySurface)) {
    return <ScreenshareDisplay />;
  }

  if (!peer) {
    return null;
  }

  const label = getVideoTileLabel({
    peerName: peer?.name,
    isLocal: false,
    track,
  });

  return (
    <StyledVideoTile.Root css={{ width, height, p: 0, minHeight: 0, margin: 'auto 0' }} data-testid="screenshare_tile">
      <StyledVideoTile.Container
        transparentBg
        ref={fullscreenRef}
        css={{ flexDirection: 'column', gap: '$6' }}
        onMouseEnter={() => setIsMouseHovered(true)}
        onMouseLeave={() => {
          setIsMouseHovered(false);
        }}
      >
        {showStatsOnTiles ? (
          <VideoTileStats audioTrackID={audioTrack?.id} videoTrackID={track?.id} peerID={peerId} isLocal={isLocal} />
        ) : null}
        {isFullScreenSupported && isMouseHovered ? (
          <StyledVideoTile.FullScreenButton onClick={() => setFullscreen(!fullscreen)}>
            {isFullscreen ? <ShrinkIcon /> : <ExpandIcon />}
          </StyledVideoTile.FullScreenButton>
        ) : null}
        {track ? (
          <Video
            screenShare={true}
            mirror={false}
            attach={!isAudioOnly}
            trackId={track.id}
            css={{ minHeight: 0, height: 'max-content', maxHeight: '100%' }}
          />
        ) : null}
        <StyledVideoTile.Info css={labelStyles}>{label}</StyledVideoTile.Info>
        {isMouseHovered && !peer.isLocal ? (
          <TileMenu
            isScreenshare
            peerID={peer.id}
            audioTrackID={audioTrack?.id}
            videoTrackID={track?.id}
            enableSpotlightingPeer={false}
          />
        ) : null}
      </StyledVideoTile.Container>
    </StyledVideoTile.Root>
  );
};

const ScreenshareTile = React.memo(Tile);

export default ScreenshareTile;
