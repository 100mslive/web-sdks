import React, { Fragment, useCallback, useMemo, useState } from 'react';
import { useMedia } from 'react-use';
import {
  selectAudioTrackByPeerID,
  selectIsPeerAudioEnabled,
  selectLocalPeerID,
  selectPeerMetadata,
  selectPeerNameByID,
  selectSessionStore,
  selectVideoTrackByID,
  selectVideoTrackByPeerID,
  useHMSStore,
} from '@100mslive/react-sdk';
import { BrbTileIcon, HandIcon, MicOffIcon } from '@100mslive/react-icons';
import TileConnection from './Connection/TileConnection';
import TileMenu, { isSameTile } from './TileMenu/TileMenu';
import { useBorderAudioLevel } from '../../AudioLevel';
import { Avatar } from '../../Avatar';
import { VideoTileStats } from '../../Stats';
import { config as cssConfig } from '../../Theme';
import { Video } from '../../Video';
import { StyledVideoTile } from '../../VideoTile';
import { getVideoTileLabel } from './peerTileUtils';
import { useAppConfig } from './AppData/useAppConfig';
import { useIsHeadless, useSetAppDataByKey, useUISettings } from './AppData/useUISettings';
import { useShowStreamingUI } from '../common/hooks';
import { APP_DATA, SESSION_STORE_KEY, UI_SETTINGS } from '../common/constants';

const Tile = ({
  peerId,
  trackId,
  width,
  height,
  objectFit = 'cover',
  canMinimise = false,
  isDragabble = false,
  rootCSS = {},
  containerCSS = {},
}) => {
  const trackSelector = trackId ? selectVideoTrackByID(trackId) : selectVideoTrackByPeerID(peerId);
  const track = useHMSStore(trackSelector);
  const peerName = useHMSStore(selectPeerNameByID(peerId));
  const audioTrack = useHMSStore(selectAudioTrackByPeerID(peerId));
  const localPeerID = useHMSStore(selectLocalPeerID);
  const isAudioOnly = useUISettings(UI_SETTINGS.isAudioOnly);
  const mirrorLocalVideo = useUISettings(UI_SETTINGS.mirrorLocalVideo);
  const showStatsOnTiles = useUISettings(UI_SETTINGS.showStatsOnTiles);
  const isHeadless = useIsHeadless();
  const isAudioMuted = !useHMSStore(selectIsPeerAudioEnabled(peerId));
  const isVideoMuted = !track?.enabled;
  const [isMouseHovered, setIsMouseHovered] = useState(false);
  const borderAudioRef = useBorderAudioLevel(audioTrack?.id);
  const isVideoDegraded = track?.degraded;
  const isLocal = localPeerID === peerId;
  const [pinnedTrackId] = useSetAppDataByKey(APP_DATA.pinnedTrackId);
  const pinned = isSameTile({
    trackId: pinnedTrackId,
    videoTrackID: track?.id,
    audioTrackID: audioTrack?.id,
  });
  const spotlighted = useHMSStore(selectSessionStore(SESSION_STORE_KEY.SPOTLIGHT)) === peerId;
  const label = getVideoTileLabel({
    peerName,
    track,
    isLocal,
  });
  const onHoverHandler = useCallback(event => {
    setIsMouseHovered(event.type === 'mouseenter');
  }, []);
  const headlessConfig = useAppConfig('headlessConfig');
  const hideLabel = isHeadless && headlessConfig?.hideTileName;
  const isTileBigEnoughToShowStats = height >= 180 && width >= 180;
  const avatarSize = useMemo(() => {
    if (!width || !height) {
      return undefined;
    }
    if (width <= 150 || height <= 150) {
      return 'small';
    } else if (width <= 300 || height <= 300) {
      return 'medium';
    }
    return 'large';
  }, [width, height]);
  const isMobile = useMedia(cssConfig.media.md);
  const showStreamingUI = useShowStreamingUI();

  return (
    <StyledVideoTile.Root
      css={{
        width,
        height,
        padding: getPadding({
          isHeadless,
          tileOffset: headlessConfig?.tileOffset,
          hideAudioLevel: headlessConfig?.hideAudioLevel,
        }),
        ...rootCSS,
      }}
      data-testid={`participant_tile_${peerName}`}
    >
      {peerName !== undefined ? (
        <StyledVideoTile.Container
          onMouseEnter={onHoverHandler}
          onMouseLeave={onHoverHandler}
          ref={isHeadless && headlessConfig?.hideAudioLevel ? undefined : borderAudioRef}
          noRadius={isHeadless && Number(headlessConfig?.tileOffset) === 0}
          css={containerCSS}
        >
          {showStatsOnTiles && isTileBigEnoughToShowStats ? (
            <VideoTileStats audioTrackID={audioTrack?.id} videoTrackID={track?.id} peerID={peerId} isLocal={isLocal} />
          ) : null}

          {track ? (
            <Video
              trackId={track?.id}
              attach={isLocal ? undefined : !isAudioOnly}
              mirror={
                mirrorLocalVideo &&
                peerId === localPeerID &&
                track?.source === 'regular' &&
                track?.facingMode !== 'environment'
              }
              noRadius={isHeadless && Number(headlessConfig?.tileOffset) === 0}
              data-testid="participant_video_tile"
              css={{
                objectFit,
                filter: isVideoDegraded ? 'blur($space$4)' : undefined,
                bg: 'transparent',
              }}
            />
          ) : null}
          {isVideoMuted || (!isLocal && isAudioOnly) ? (
            <StyledVideoTile.AvatarContainer>
              <Avatar name={peerName || ''} data-testid="participant_avatar_icon" size={avatarSize} />
            </StyledVideoTile.AvatarContainer>
          ) : null}

          {showAudioMuted({
            hideTileAudioMute: headlessConfig?.hideTileAudioMute,
            isHeadless,
            isAudioMuted,
          }) ? (
            <StyledVideoTile.AudioIndicator
              data-testid="participant_audio_mute_icon"
              size={width && height && (width < 180 || height < 180) ? 'small' : 'medium'}
            >
              <MicOffIcon />
            </StyledVideoTile.AudioIndicator>
          ) : null}
          {(isMouseHovered || isDragabble) && !isHeadless ? (
            <TileMenu
              peerID={peerId}
              audioTrackID={audioTrack?.id}
              videoTrackID={track?.id}
              canMinimise={canMinimise}
            />
          ) : null}
          <PeerMetadata peerId={peerId} />
          {showStreamingUI && isMobile ? null : (
            <TileConnection
              hideLabel={hideLabel}
              name={label}
              isTile
              peerId={peerId}
              width={width}
              pinned={pinned}
              spotlighted={spotlighted}
            />
          )}
        </StyledVideoTile.Container>
      ) : null}
    </StyledVideoTile.Root>
  );
};

const metaStyles = { top: '$4', left: '$4' };

const PeerMetadata = ({ peerId }) => {
  const metaData = useHMSStore(selectPeerMetadata(peerId));
  const isHandRaised = metaData?.isHandRaised || false;
  const isBRB = metaData?.isBRBOn || false;

  return (
    <Fragment>
      {isHandRaised ? (
        <StyledVideoTile.AttributeBox css={metaStyles} data-testid="raiseHand_icon_onTile">
          <HandIcon width={24} height={24} />
        </StyledVideoTile.AttributeBox>
      ) : null}
      {isBRB ? (
        <StyledVideoTile.AttributeBox css={metaStyles} data-testid="brb_icon_onTile">
          <BrbTileIcon width={24} height={24} />
        </StyledVideoTile.AttributeBox>
      ) : null}
    </Fragment>
  );
};

const VideoTile = React.memo(Tile);

const showAudioMuted = ({ hideTileAudioMute, isHeadless, isAudioMuted }) => {
  if (!isHeadless) {
    return isAudioMuted;
  }
  return isAudioMuted && !hideTileAudioMute;
};

const getPadding = ({ isHeadless, tileOffset, hideAudioLevel }) => {
  if (!isHeadless || isNaN(Number(tileOffset))) {
    return undefined;
  }
  // Adding extra padding of 3px to ensure that the audio border is visible properly between tiles when tileOffset is 0.
  return Number(tileOffset) === 0 ? (hideAudioLevel ? 0 : 3) : undefined;
};

export default VideoTile;
