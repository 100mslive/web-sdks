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
import TileMenu from './TileMenu/TileMenu';
import { VideoTileStats } from '../../Stats';
import { Video } from '../../Video';
import { StyledVideoTile } from '../../VideoTile';
import { getVideoTileLabel } from './peerTileUtils';
import { ScreenshareDisplay } from './ScreenshareDisplay';
import { useIsHeadless, useUISettings } from './AppData/useUISettings';
import { UI_SETTINGS } from '../common/constants';

const labelStyles = {
  position: 'unset',
  width: '100%',
  textAlign: 'center',
  transform: 'none',
  mt: '$2',
  flexShrink: 0,
};

const Tile = ({ peerId, width = '100%', height = '100%' }) => {
  const isLocal = useHMSStore(selectLocalPeerID) === peerId;
  const track = useHMSStore(selectScreenShareByPeerID(peerId));
  const peer = useHMSStore(selectPeerByID(peerId));
  const isAudioOnly = useUISettings(UI_SETTINGS.isAudioOnly);
  const isHeadless = useIsHeadless();
  const [isMouseHovered, setIsMouseHovered] = useState(false);
  const showStatsOnTiles = useUISettings(UI_SETTINGS.showStatsOnTiles);
  const label = getVideoTileLabel({
    peerName: peer.name,
    isLocal: false,
    track,
  });
  const fullscreenRef = useRef(null);
  // fullscreen is for desired state
  const [fullscreen, setFullscreen] = useState(false);
  // isFullscreen is for true state
  const isFullscreen = useFullscreen(fullscreenRef, fullscreen, {
    onClose: () => setFullscreen(false),
  });
  const isFullScreenSupported = screenfull.isEnabled;
  const audioTrack = useHMSStore(selectScreenShareAudioByPeerID(peer?.id));

  if (isLocal && !['browser', 'window', 'application'].includes(track?.displaySurface)) {
    return <ScreenshareDisplay />;
  }

  if (!peer) {
    return null;
  }
  return (
    <StyledVideoTile.Root css={{ width, height, p: 0, mb: '$4', minHeight: 0 }} data-testid="screenshare_tile">
      <StyledVideoTile.Container
        transparentBg
        ref={fullscreenRef}
        css={{ flexDirection: 'column' }}
        onMouseEnter={() => setIsMouseHovered(true)}
        onMouseLeave={() => {
          setIsMouseHovered(false);
        }}
      >
        {showStatsOnTiles ? (
          <VideoTileStats audioTrackID={audioTrack?.id} videoTrackID={track?.id} peerID={peerId} isLocal={isLocal} />
        ) : null}
        {isFullScreenSupported && !isHeadless ? (
          <StyledVideoTile.FullScreenButton onClick={() => setFullscreen(!fullscreen)}>
            {isFullscreen ? <ShrinkIcon /> : <ExpandIcon />}
          </StyledVideoTile.FullScreenButton>
        ) : null}
        {track ? (
          <Video
            screenShare={true}
            mirror={peer.isLocal && track?.source === 'regular'}
            attach={!isAudioOnly}
            trackId={track.id}
          />
        ) : null}
        <StyledVideoTile.Info css={labelStyles}>{label}</StyledVideoTile.Info>
        {isMouseHovered && !isHeadless && !peer?.isLocal ? (
          <TileMenu isScreenshare peerID={peer?.id} audioTrackID={audioTrack?.id} videoTrackID={track?.id} />
        ) : null}
      </StyledVideoTile.Container>
    </StyledVideoTile.Root>
  );
};

const ScreenshareTile = React.memo(Tile);

export default ScreenshareTile;
