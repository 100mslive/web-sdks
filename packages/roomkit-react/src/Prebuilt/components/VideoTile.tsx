import React, { useCallback, useMemo, useState } from 'react';
import { useMeasure } from 'react-use';
import {
  selectAudioTrackByPeerID,
  selectHasPeerHandRaised,
  selectIsPeerAudioEnabled,
  selectLocalPeerID,
  selectPeerMetadata,
  selectPeerNameByID,
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
import { CSS } from '../../Theme';
import { Video } from '../../Video';
import { StyledVideoTile } from '../../VideoTile';
import { getVideoTileLabel } from './peerTileUtils';
// @ts-ignore: No implicit Any
import { useSetAppDataByKey, useUISettings } from './AppData/useUISettings';
// @ts-ignore: No implicit Any
import { calculateAvatarAndAttribBoxSize } from '../common/utils';
import { APP_DATA, UI_SETTINGS } from '../common/constants';

const PeerMetadata = ({ peerId, size }: { peerId: string; size?: 'medium' | 'small' }) => {
  const metaData = useHMSStore(selectPeerMetadata(peerId));
  const isBRB = metaData?.isBRBOn || false;
  const isHandRaised = useHMSStore(selectHasPeerHandRaised(peerId));

  return (
    <>
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
    </>
  );
};

const Tile = ({
  peerId = '',
  trackId = '',
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
}: {
  peerId?: string;
  trackId?: string;
  width?: string | number;
  height?: string | number;
  objectFit?: string;
  canMinimise?: boolean;
  isDragabble?: boolean;
  rootCSS?: CSS;
  containerCSS?: CSS;
  enableSpotlightingPeer?: boolean;
  hideParticipantNameOnTile?: boolean;
  roundedVideoTile?: boolean;
  hideAudioMuteOnTile?: boolean;
  hideMetadataOnTile?: boolean;
}) => {
  const trackSelector = trackId ? selectVideoTrackByID(trackId) : selectVideoTrackByPeerID(peerId);
  const track = useHMSStore(trackSelector);
  const { avatarImageUrl } = useHMSStore(selectPeerMetadata(peerId));
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
  const label = getVideoTileLabel({
    peerName,
    isLocal,
    videoTrack: track,
    audioTrack,
  });
  const onHoverHandler = useCallback((event: React.MouseEvent) => {
    setIsMouseHovered(event.type === 'mouseenter');
  }, []);

  const [ref, { width: calculatedWidth, height: calculatedHeight }] = useMeasure<HTMLDivElement>();

  const isTileBigEnoughToShowStats = calculatedHeight >= 180 && calculatedWidth >= 180;

  const [avatarSize, attribBoxSize] = useMemo(
    () => calculateAvatarAndAttribBoxSize(calculatedWidth, calculatedHeight),
    [calculatedWidth, calculatedHeight],
  );

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
          {calculatedWidth > 0 && calculatedHeight > 0 ? (
            <>
              {isVideoMuted || (!isLocal && isAudioOnly) ? (
                <StyledVideoTile.AvatarContainer>
                  <Avatar
                    imageUrl={avatarImageUrl}
                    name={peerName || ''}
                    data-testid="participant_avatar_icon"
                    size={avatarSize}
                  />
                </StyledVideoTile.AvatarContainer>
              ) : null}
              {!hideAudioMuteOnTile && isAudioMuted ? (
                <StyledVideoTile.AudioIndicator data-testid="participant_audio_mute_icon" size={attribBoxSize}>
                  <MicOffIcon />
                </StyledVideoTile.AudioIndicator>
              ) : null}
              {!hideAudioMuteOnTile && !isAudioMuted ? (
                <StyledVideoTile.AudioIndicator size={attribBoxSize}>
                  <AudioLevel trackId={audioTrack?.id} size={attribBoxSize} />
                </StyledVideoTile.AudioIndicator>
              ) : null}
              {!hideMetadataOnTile && <PeerMetadata peerId={peerId} size={attribBoxSize} />}
            </>
          ) : null}
          {isMouseHovered || (isDragabble && navigator.maxTouchPoints > 0) ? (
            <TileMenu
              peerID={peerId}
              audioTrackID={audioTrack?.id || ''}
              videoTrackID={track?.id || ''}
              canMinimise={canMinimise}
              enableSpotlightingPeer={enableSpotlightingPeer}
            />
          ) : null}

          <TileConnection
            hideLabel={hideParticipantNameOnTile}
            name={label}
            peerId={peerId}
            width={width}
            pinned={pinned}
          />
        </StyledVideoTile.Container>
      ) : null}
    </StyledVideoTile.Root>
  );
};

const VideoTile = React.memo(Tile);

export default VideoTile;
