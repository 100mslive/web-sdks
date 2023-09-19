import React, { Fragment, useCallback, useMemo, useRef, useState } from 'react';
import { useMedia } from 'react-use';
import {
  selectAudioTrackByPeerID,
  selectHasPeerHandRaised,
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
import { AudioLevel } from '../../AudioLevel';
import { Avatar } from '../../Avatar';
import { VideoTileStats } from '../../Stats';
import { config as cssConfig } from '../../Theme';
import { Video } from '../../Video';
import { StyledVideoTile } from '../../VideoTile';
import { getVideoTileLabel } from './peerTileUtils';
import { useSetAppDataByKey, useUISettings } from './AppData/useUISettings';
import { getAttributeBoxSize } from '../common/utils';
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
  hideMetadataOnTile = false,
}) => {
  const trackSelector = trackId ? selectVideoTrackByID(trackId) : selectVideoTrackByPeerID(peerId);
  const track = useHMSStore(trackSelector);
  const isMobile = useMedia(cssConfig.media.md);
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

  const ref = useRef(null);
  const calculatedHeight = ref.current?.clientHeight || '';
  const calculatedWidth = ref.current?.clientWidth || '';

  const isTileBigEnoughToShowStats = calculatedHeight >= 180 && calculatedWidth >= 180;

  const [avatarSize, attribBoxSize] = useMemo(() => {
    let size;
    if (!calculatedWidth || !calculatedHeight) {
      size = undefined;
    }
    if (calculatedWidth <= 150 || calculatedHeight <= 150) {
      size = 'small';
    } else if (calculatedWidth <= 300 || calculatedHeight <= 300) {
      size = 'medium';
    } else {
      size = 'large';
    }
    return [size, getAttributeBoxSize(calculatedWidth, calculatedHeight)];
  }, [calculatedWidth, calculatedHeight]);

  return (
    <StyledVideoTile.Root
      ref={ref}
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

          {isVideoMuted || (!isLocal && isAudioOnly) ? (
            <StyledVideoTile.AvatarContainer>
              <Avatar name={peerName || ''} data-testid="participant_avatar_icon" size={avatarSize} />
            </StyledVideoTile.AvatarContainer>
          ) : null}

          {!hideAudioMuteOnTile ? (
            isAudioMuted ? (
              <StyledVideoTile.AudioIndicator data-testid="participant_audio_mute_icon" size={attribBoxSize}>
                <MicOffIcon />
              </StyledVideoTile.AudioIndicator>
            ) : (
              <StyledVideoTile.AudioIndicator size={attribBoxSize}>
                <AudioLevel trackId={audioTrack?.id} />
              </StyledVideoTile.AudioIndicator>
            )
          ) : null}
          {isMouseHovered || (isDragabble && isMobile) ? (
            <TileMenu
              peerID={peerId}
              audioTrackID={audioTrack?.id}
              videoTrackID={track?.id}
              canMinimise={canMinimise}
              enableSpotlightingPeer={enableSpotlightingPeer}
            />
          ) : null}
          {!hideMetadataOnTile && <PeerMetadata peerId={peerId} size={attribBoxSize} />}

          <TileConnection
            hideLabel={hideParticipantNameOnTile}
            name={label}
            isTile
            peerId={peerId}
            width={width}
            pinned={pinned}
            spotlighted={spotlighted}
          />
        </StyledVideoTile.Container>
      ) : null}
    </StyledVideoTile.Root>
  );
};

const PeerMetadata = ({ peerId, size }) => {
  const metaData = useHMSStore(selectPeerMetadata(peerId));
  const isBRB = metaData?.isBRBOn || false;
  const isHandRaised = useHMSStore(selectHasPeerHandRaised(peerId));

  return (
    <Fragment>
      {isHandRaised ? (
        <StyledVideoTile.AttributeBox size={size} data-testid="raiseHand_icon_onTile">
          <HandIcon width={24} height={24} />
        </StyledVideoTile.AttributeBox>
      ) : null}
      {isBRB ? (
        <StyledVideoTile.AttributeBox size={size} data-testid="brb_icon_onTile">
          <BrbTileIcon width={22} height={22} />
        </StyledVideoTile.AttributeBox>
      ) : null}
    </Fragment>
  );
};

const VideoTile = React.memo(Tile);

export default VideoTile;
