import React, { Fragment, useCallback, useMemo, useState } from 'react';
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
import { Avatar } from '../../Avatar';
import { VideoTileStats } from '../../Stats';
import { Video } from '../../Video';
import { StyledVideoTile } from '../../VideoTile';
import { AudioLevelAnimation } from './AudioLevelAnimation';
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
  hideMetadataOnTile = false,
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
              <StyledVideoTile.AudioIndicator
                data-testid="participant_audio_mute_icon"
                size={width && height && (width < 180 || height < 180) ? 'small' : 'medium'}
              >
                <MicOffIcon />
              </StyledVideoTile.AudioIndicator>
            ) : (
              <AudioLevel trackId={audioTrack?.id} />
            )
          ) : null}
          {isMouseHovered || isDragabble ? (
            <TileMenu
              peerID={peerId}
              audioTrackID={audioTrack?.id}
              videoTrackID={track?.id}
              canMinimise={canMinimise}
              enableSpotlightingPeer={enableSpotlightingPeer}
            />
          ) : null}
          {!hideMetadataOnTile && <PeerMetadata peerId={peerId} />}

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

const metaStyles = { top: '$4', left: '$4', width: '$14', height: '$14' };
export const AudioLevel = ({ trackId }) => {
  return (
    <StyledVideoTile.AudioIndicator>
      <AudioLevelAnimation trackId={trackId} />
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
          <BrbTileIcon width={22} height={22} />
        </StyledVideoTile.AttributeBox>
      ) : null}
    </Fragment>
  );
};

const VideoTile = React.memo(Tile);

export default VideoTile;
