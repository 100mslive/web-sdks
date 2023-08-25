import React, { Fragment } from 'react';
import {
  selectPermissions,
  selectSessionStore,
  selectTrackByID,
  useCustomEvent,
  useHMSActions,
  useHMSStore,
  useRemoteAVToggle,
} from '@100mslive/react-sdk';
import {
  MicOffIcon,
  MicOnIcon,
  PencilIcon,
  PinIcon,
  RemoveUserIcon,
  ShareScreenIcon,
  ShrinkIcon,
  SpeakerIcon,
  StarIcon,
  VideoOffIcon,
  VideoOnIcon,
} from '@100mslive/react-icons';
import { Box, Flex } from '../../../Layout';
import { Slider } from '../../../Slider';
import { Text } from '../../../Text';
import { StyledMenuTile } from '../../../TileMenu';
import { ToastManager } from '../Toast/ToastManager';
import { useSetAppDataByKey } from '../AppData/useUISettings';
import { useDropdownSelection } from '../hooks/useDropdownSelection';
import { useIsFeatureEnabled } from '../hooks/useFeatures';
import { APP_DATA, FEATURE_LIST, REMOTE_STOP_SCREENSHARE_TYPE, SESSION_STORE_KEY } from '../../common/constants';

export const isSameTile = ({ trackId, videoTrackID, audioTrackID }) =>
  trackId && ((videoTrackID && videoTrackID === trackId) || (audioTrackID && audioTrackID === trackId));

const spacingCSS = { '@md': { my: '$8', fontWeight: '$semiBold', fontSize: 'sm' } };

const SpotlightActions = ({
  peerId,
  onSpotLightClick = () => {
    return;
  },
}) => {
  const hmsActions = useHMSActions();
  const spotlightPeerId = useHMSStore(selectSessionStore(SESSION_STORE_KEY.SPOTLIGHT));
  const isTileSpotlighted = spotlightPeerId === peerId;

  const setSpotlightPeerId = peer =>
    hmsActions.sessionStore
      .set(SESSION_STORE_KEY.SPOTLIGHT, peer)
      .catch(err => ToastManager.addToast({ title: err.description }));

  return (
    <StyledMenuTile.ItemButton
      css={spacingCSS}
      onClick={() => {
        if (isTileSpotlighted) {
          setSpotlightPeerId();
        } else {
          setSpotlightPeerId(peerId);
        }
        onSpotLightClick();
      }}
    >
      <StarIcon />
      <span>{isTileSpotlighted ? 'Remove from Spotlight' : 'Spotlight Tile for everyone'}</span>
    </StyledMenuTile.ItemButton>
  );
};

const PinActions = ({ audioTrackID, videoTrackID }) => {
  const [pinnedTrackId, setPinnedTrackId] = useSetAppDataByKey(APP_DATA.pinnedTrackId);

  const isTilePinned = isSameTile({
    trackId: pinnedTrackId,
    videoTrackID,
    audioTrackID,
  });

  return (
    <>
      <StyledMenuTile.ItemButton
        css={spacingCSS}
        onClick={() => (isTilePinned ? setPinnedTrackId() : setPinnedTrackId(videoTrackID || audioTrackID))}
      >
        <PinIcon />
        <span>{isTilePinned ? 'Unpin' : 'Pin'} Tile for myself</span>
      </StyledMenuTile.ItemButton>
    </>
  );
};

const MinimiseInset = () => {
  const [minimised, setMinimised] = useSetAppDataByKey(APP_DATA.minimiseInset);

  return (
    <>
      <StyledMenuTile.ItemButton css={spacingCSS} onClick={() => setMinimised(!minimised)}>
        <ShrinkIcon />
        <span>{minimised ? 'Show' : 'Minimise'} your video</span>
      </StyledMenuTile.ItemButton>
    </>
  );
};

const SimulcastLayers = ({ trackId }) => {
  const track = useHMSStore(selectTrackByID(trackId));
  const actions = useHMSActions();
  const bg = useDropdownSelection();
  if (!track?.layerDefinitions?.length || track.degraded || !track.enabled) {
    return null;
  }
  const currentLayer = track.layerDefinitions.find(layer => layer.layer === track.layer);
  return (
    <Fragment>
      <StyledMenuTile.ItemButton css={{ color: '$on_surface_medium', cursor: 'default' }}>
        Select maximum resolution
      </StyledMenuTile.ItemButton>
      {track.layerDefinitions.map(layer => {
        return (
          <StyledMenuTile.ItemButton
            key={layer.layer}
            onClick={async () => {
              await actions.setPreferredLayer(trackId, layer.layer);
            }}
            css={{
              justifyContent: 'space-between',
              bg: track.preferredLayer === layer.layer ? bg : undefined,
              '&:hover': {
                bg: track.preferredLayer === layer.layer ? bg : undefined,
              },
            }}
          >
            <Text
              as="span"
              css={{
                textTransform: 'capitalize',
                mr: '$2',
                fontWeight: track.preferredLayer === layer.layer ? '$semiBold' : '$regular',
              }}
            >
              {layer.layer}
            </Text>
            <Text as="span" variant="xs" css={{ color: '$on_surface_medium' }}>
              {layer.resolution.width}x{layer.resolution.height}
            </Text>
          </StyledMenuTile.ItemButton>
        );
      })}
      <StyledMenuTile.ItemButton>
        <Text as="span" variant="xs" css={{ color: '$on_surface_medium' }}>
          Currently streaming:
          <Text
            as="span"
            variant="xs"
            css={{
              fontWeight: '$semiBold',
              textTransform: 'capitalize',
              color: '$on_surface_medium',
              ml: '$2',
            }}
          >
            {currentLayer ? (
              <>
                {track.layer} ({currentLayer.resolution.width}x{currentLayer.resolution.height})
              </>
            ) : (
              '-'
            )}
          </Text>
        </Text>
      </StyledMenuTile.ItemButton>
    </Fragment>
  );
};

export const TileMenuContent = props => {
  const actions = useHMSActions();
  const { removeOthers } = useHMSStore(selectPermissions);
  const {
    videoTrackID,
    audioTrackID,
    isLocal,
    isScreenshare,
    showSpotlight,
    showPinAction,
    peerID,
    canMinimise,
    closeSheetOnClick = () => {
      return;
    },
    openNameChangeModal = () => {
      return;
    },
  } = props;

  const { isAudioEnabled, isVideoEnabled, setVolume, toggleAudio, toggleVideo, volume } = useRemoteAVToggle(
    audioTrackID,
    videoTrackID,
  );

  const { sendEvent } = useCustomEvent({
    type: REMOTE_STOP_SCREENSHARE_TYPE,
  });

  const isChangeNameEnabled = useIsFeatureEnabled(FEATURE_LIST.CHANGE_NAME);

  return isLocal ? (
    (showPinAction || canMinimise) && (
      <>
        {showPinAction && <PinActions audioTrackID={audioTrackID} videoTrackID={videoTrackID} />}
        {showSpotlight && <SpotlightActions peerId={peerID} onSpotLightClick={() => closeSheetOnClick()} />}
        {canMinimise && <MinimiseInset />}
        {isChangeNameEnabled ? (
          <StyledMenuTile.ItemButton
            onClick={() => {
              openNameChangeModal();
              closeSheetOnClick();
            }}
          >
            <PencilIcon />
            <Text variant="sm" css={{ '@md': { fontWeight: '$semiBold' }, c: '$on_surface_high' }}>
              Change Name
            </Text>
          </StyledMenuTile.ItemButton>
        ) : null}
      </>
    )
  ) : (
    <>
      {toggleVideo ? (
        <StyledMenuTile.ItemButton
          css={spacingCSS}
          onClick={() => {
            toggleVideo();
            closeSheetOnClick();
          }}
          data-testid={isVideoEnabled ? 'mute_video_participant_btn' : 'unmute_video_participant_btn'}
        >
          {isVideoEnabled ? <VideoOnIcon /> : <VideoOffIcon />}
          <span>{isVideoEnabled ? 'Mute' : 'Request Unmute'}</span>
        </StyledMenuTile.ItemButton>
      ) : null}

      {toggleAudio ? (
        <StyledMenuTile.ItemButton
          css={spacingCSS}
          onClick={() => {
            toggleAudio();
            closeSheetOnClick();
          }}
          data-testid={isVideoEnabled ? 'mute_audio_participant_btn' : 'unmute_audio_participant_btn'}
        >
          {isAudioEnabled ? <MicOnIcon /> : <MicOffIcon />}
          <span>{isAudioEnabled ? 'Mute' : 'Request Unmute'}</span>
        </StyledMenuTile.ItemButton>
      ) : null}

      {audioTrackID ? (
        <StyledMenuTile.VolumeItem data-testid="participant_volume_slider" css={{ ...spacingCSS, mb: '$0' }}>
          <Flex align="center" gap={1}>
            <SpeakerIcon />
            <Box as="span" css={{ ml: '$4' }}>
              Volume ({volume})
            </Box>
          </Flex>
          <Slider css={{ my: '0.5rem' }} step={5} value={[volume]} onValueChange={e => setVolume(e[0])} />
        </StyledMenuTile.VolumeItem>
      ) : null}

      {showPinAction && (
        <>
          <PinActions audioTrackID={audioTrackID} videoTrackID={videoTrackID} />
          {showSpotlight && <SpotlightActions peerId={peerID} onSpotLightClick={() => closeSheetOnClick()} />}
        </>
      )}

      <SimulcastLayers trackId={videoTrackID} />

      {removeOthers ? (
        <StyledMenuTile.RemoveItem
          css={{ ...spacingCSS, borderTop: 'none' }}
          onClick={async () => {
            try {
              await actions.removePeer(peerID, '');
            } catch (error) {
              // TODO: Toast here
            }
            closeSheetOnClick();
          }}
          data-testid="remove_participant_btn"
        >
          <RemoveUserIcon />
          <span>Remove Participant</span>
        </StyledMenuTile.RemoveItem>
      ) : null}

      {removeOthers && isScreenshare ? (
        <StyledMenuTile.RemoveItem
          onClick={() => {
            sendEvent({});
            closeSheetOnClick();
          }}
          css={spacingCSS}
        >
          <ShareScreenIcon />
          <span>Stop Screenshare</span>
        </StyledMenuTile.RemoveItem>
      ) : null}
    </>
  );
};
