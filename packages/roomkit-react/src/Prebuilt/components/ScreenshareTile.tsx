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
import { Box } from '../../Layout';
import { VideoTileStats } from '../../Stats';
import { config as cssConfig, useTheme } from '../../Theme';
import { Video } from '../../Video';
import { StyledVideoTile } from '../../VideoTile';
import { LayoutModeSelector } from './LayoutModeSelector';
import { getVideoTileLabel } from './peerTileUtils';
import { ScreenshareDisplay } from './ScreenshareDisplay';
import { useMedia } from '../common/useMediaOverride';
// @ts-ignore: No implicit Any
import { useUISettings } from './AppData/useUISettings';
import { UI_SETTINGS } from '../common/constants';

const labelStyles = {
  position: 'unset',
  width: '100%',
  textAlign: 'center',
  c: '$on_surface_high',
  transform: 'none',
  flexShrink: 0,
};

const Tile = ({ peerId, width = '100%', height = '100%' }: { peerId: string; width?: string; height?: string }) => {
  const isLocal = useHMSStore(selectLocalPeerID) === peerId;
  const track = useHMSStore(selectScreenShareByPeerID(peerId));
  const { theme } = useTheme();
  const peer = useHMSStore(selectPeerByID(peerId));
  const isAudioOnly = useUISettings(UI_SETTINGS.isAudioOnly);
  const [isMouseHovered, setIsMouseHovered] = useState(false);
  const isMobile = useMedia(cssConfig.media.md);
  const showStatsOnTiles = useUISettings(UI_SETTINGS.showStatsOnTiles);
  const fullscreenRef = useRef<HTMLDivElement | null>(null);
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
    videoTrack: track,
    audioTrack,
  });

  return (
    <StyledVideoTile.Root
      css={{
        width,
        height,
        p: 0,
        minHeight: 0,
      }}
      data-testid="screenshare_tile"
    >
      <StyledVideoTile.Container
        transparentBg
        ref={fullscreenRef}
        css={{ flexDirection: 'column', gap: '$2' }}
        onMouseEnter={() => setIsMouseHovered(true)}
        onMouseLeave={() => {
          setIsMouseHovered(false);
        }}
      >
        {showStatsOnTiles ? (
          <VideoTileStats audioTrackID={audioTrack?.id} videoTrackID={track?.id} peerID={peerId} isLocal={isLocal} />
        ) : null}
        {isFullScreenSupported && isMouseHovered ? (
          <StyledVideoTile.FullScreenButton
            css={{ bg: `${theme.colors.background_dim.value}A3` }}
            onClick={() => setFullscreen(!fullscreen)}
          >
            {isFullscreen ? <ShrinkIcon /> : <ExpandIcon />}
          </StyledVideoTile.FullScreenButton>
        ) : null}
        {!isMobile && isMouseHovered && !isFullscreen && (
          <Box
            css={{
              position: 'absolute',
              top: '$2',
              r: '$1',
              h: '$14',
              right: isFullScreenSupported ? '$17' : '$2',
              zIndex: 5,
              bg: `${theme.colors.background_dim.value}A3`,
            }}
          >
            <LayoutModeSelector />
          </Box>
        )}

        {track ? (
          <Video screenShare={true} mirror={false} attach={!isAudioOnly} trackId={track.id} css={{ minHeight: 0 }} />
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
