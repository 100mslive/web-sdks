import React, { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMedia } from 'react-use';
import {
  selectAudioTrackByPeerID,
  selectIsPeerAudioEnabled,
  selectLocalPeerID,
  selectPeerMetadata,
  selectPeerNameByID,
  selectSessionStore,
  selectTrackAudioByID,
  selectVideoTrackByID,
  selectVideoTrackByPeerID,
  useHMSStore,
  useHMSVanillaStore,
} from '@100mslive/react-sdk';
import { BrbTileIcon, HandIcon, MicOffIcon } from '@100mslive/react-icons';
import TileConnection from './Connection/TileConnection';
import TileMenu, { isSameTile } from './TileMenu/TileMenu';
import { Avatar } from '../../Avatar';
import { Box, Flex } from '../../Layout';
import { VideoTileStats } from '../../Stats';
import { config as cssConfig, keyframes } from '../../Theme';
import { Video } from '../../Video';
import { StyledVideoTile } from '../../VideoTile';
import { getVideoTileLabel } from './peerTileUtils';
import { useSetAppDataByKey, useUISettings } from './AppData/useUISettings';
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
  enableSpotlightingPeer = true,
  hideParticipantNameOnTile = false,
  roundedVideoTile = true,
  hideAudioMuteOnTile = false,
}) => {
  const trackSelector = trackId ? selectVideoTrackByID(trackId) : selectVideoTrackByPeerID(peerId);
  const track = useHMSStore(trackSelector);
  const peerName = useHMSStore(selectPeerNameByID(peerId));
  const audioTrack = useHMSStore(selectAudioTrackByPeerID(peerId));
  const localPeerID = useHMSStore(selectLocalPeerID);
  const isAudioOnly = useUISettings(UI_SETTINGS.isAudioOnly);
  const mirrorLocalVideo = useUISettings(UI_SETTINGS.mirrorLocalVideo);
  const showStatsOnTiles = useUISettings(UI_SETTINGS.showStatsOnTiles);
  const isAudioMuted = !useHMSStore(selectIsPeerAudioEnabled(peerId));
  const isVideoMuted = !track?.enabled;
  const [isMouseHovered, setIsMouseHovered] = useState(false);
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

  return (
    <StyledVideoTile.Root
      css={{
        width,
        height,
        ...rootCSS,
      }}
      data-testid={`participant_tile_${peerName}`}
    >
      {peerName !== undefined ? (
        <StyledVideoTile.Container
          onMouseEnter={onHoverHandler}
          onMouseLeave={onHoverHandler}
          noRadius={!roundedVideoTile}
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
              noRadius={!roundedVideoTile}
              data-testid="participant_video_tile"
              css={{
                objectFit,
                filter: isVideoDegraded ? 'blur($space$2)' : undefined,
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
            hideAudioMute: hideAudioMuteOnTile,
            isAudioMuted,
          }) ? (
            <StyledVideoTile.AudioIndicator
              data-testid="participant_audio_mute_icon"
              size={width && height && (width < 180 || height < 180) ? 'small' : 'medium'}
            >
              <MicOffIcon />
            </StyledVideoTile.AudioIndicator>
          ) : (
            <AudioLevel trackId={audioTrack?.id} />
          )}
          {isMouseHovered || isDragabble ? (
            <TileMenu
              peerID={peerId}
              audioTrackID={audioTrack?.id}
              videoTrackID={track?.id}
              canMinimise={canMinimise}
              enableSpotlightingPeer={enableSpotlightingPeer}
            />
          ) : null}
          <PeerMetadata peerId={peerId} />
          {isMobile ? null : (
            <TileConnection
              hideLabel={hideParticipantNameOnTile}
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

const heightAnimation = value =>
  keyframes({
    '50%': {
      transform: `scale3d(1,${value},1)`,
    },
    '100%': {
      transform: `scale3d(1,1,1)`,
    },
  });

const AudioLevelIndicator = ({ trackId, value, delay }) => {
  const vanillaStore = useHMSVanillaStore();
  const ref = useRef();

  useEffect(() => {
    const unsubscribe = vanillaStore.subscribe(audioLevel => {
      if (ref.current) {
        ref.current.style['animation'] = `${heightAnimation(
          audioLevel ? value : 1,
        )} 0.3s cubic-bezier(0.61, 1, 0.88, 1) infinite ${delay}s`;
      }
    }, selectTrackAudioByID(trackId));
    return unsubscribe;
  }, [vanillaStore, trackId, value, delay]);
  return (
    <Box
      ref={ref}
      css={{
        w: 4,
        height: 6,
        r: 2,
        bg: '$on_primary_high',
      }}
    />
  );
};

export const AudioLevel = ({ trackId }) => {
  return (
    <StyledVideoTile.AudioIndicator>
      <Flex align="center" justify="center" css={{ gap: '$2' }}>
        {[3, 2, 3].map((v, i) => (
          <AudioLevelIndicator trackId={trackId} value={v} delay={i * 0.15} key={i} />
        ))}
      </Flex>
    </StyledVideoTile.AudioIndicator>
  );
};

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

const showAudioMuted = ({ hideAudioMute, isAudioMuted }) => {
  return isAudioMuted && !hideAudioMute;
};

export default VideoTile;
