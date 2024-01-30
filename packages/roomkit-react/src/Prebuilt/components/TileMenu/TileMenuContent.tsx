import React, { Fragment } from 'react';
import { useMedia } from 'react-use';
import {
  HMSException,
  HMSSimulcastLayerDefinition,
  HMSTrackID,
  HMSVideoTrack,
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
import { config as cssConfig } from '../../../Theme';
import { StyledMenuTile } from '../../../TileMenu';
import { useHMSPrebuiltContext } from '../../AppContext';
// @ts-ignore
import { ToastManager } from '../Toast/ToastManager';
// @ts-ignore
import { useSetAppDataByKey } from '../AppData/useUISettings';
// @ts-ignore
import { useDropdownSelection } from '../hooks/useDropdownSelection';
import { getDragClassName } from './utils';
import { APP_DATA, REMOTE_STOP_SCREENSHARE_TYPE, SESSION_STORE_KEY } from '../../common/constants';

export const isSameTile = ({
  trackId,
  videoTrackID,
  audioTrackID,
}: {
  trackId: HMSTrackID;
  videoTrackID?: string;
  audioTrackID?: string;
}) => !!trackId && ((!!videoTrackID && videoTrackID === trackId) || (!!audioTrackID && audioTrackID === trackId));

const spacingCSS = { '@md': { my: '$8', fontWeight: '$semiBold', fontSize: 'sm' } };

const SpotlightActions = ({
  peerId,
  onSpotLightClick = () => {
    return;
  },
}: {
  peerId: string;
  onSpotLightClick: () => void;
}) => {
  const hmsActions = useHMSActions();
  const spotlightPeerId = useHMSStore(selectSessionStore(SESSION_STORE_KEY.SPOTLIGHT));
  const isTileSpotlighted = spotlightPeerId === peerId;
  const dragClassName = getDragClassName();

  const setSpotlightPeerId = (peerIdToSpotlight?: string) =>
    hmsActions.sessionStore
      .set(SESSION_STORE_KEY.SPOTLIGHT, peerIdToSpotlight)
      .catch((err: HMSException) => ToastManager.addToast({ title: err.description }));

  return (
    <StyledMenuTile.ItemButton
      className={dragClassName}
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
      <StarIcon height={20} width={20} />
      <span>{isTileSpotlighted ? 'Remove from Spotlight' : 'Spotlight Tile for everyone'}</span>
    </StyledMenuTile.ItemButton>
  );
};

const PinActions = ({ audioTrackID, videoTrackID }: { videoTrackID: string; audioTrackID: string }) => {
  const [pinnedTrackId, setPinnedTrackId] = useSetAppDataByKey(APP_DATA.pinnedTrackId);
  const dragClassName = getDragClassName();

  const isTilePinned = isSameTile({
    trackId: pinnedTrackId,
    videoTrackID,
    audioTrackID,
  });

  return (
    <>
      <StyledMenuTile.ItemButton
        className={dragClassName}
        css={spacingCSS}
        onClick={() => (isTilePinned ? setPinnedTrackId() : setPinnedTrackId(videoTrackID || audioTrackID))}
      >
        <PinIcon height={20} width={20} />
        <span>{isTilePinned ? 'Unpin' : 'Pin'} Tile for myself</span>
      </StyledMenuTile.ItemButton>
    </>
  );
};

const MinimiseInset = () => {
  const [minimised, setMinimised] = useSetAppDataByKey(APP_DATA.minimiseInset);
  const dragClassName = getDragClassName();

  return (
    <>
      <StyledMenuTile.ItemButton className={dragClassName} css={spacingCSS} onClick={() => setMinimised(!minimised)}>
        <ShrinkIcon height={20} width={20} />
        <span>{minimised ? 'Show' : 'Minimise'} your video</span>
      </StyledMenuTile.ItemButton>
    </>
  );
};

const SimulcastLayers = ({ trackId }: { trackId: HMSTrackID }) => {
  const track: HMSVideoTrack = useHMSStore(selectTrackByID(trackId)) as HMSVideoTrack;
  const actions = useHMSActions();
  const bg = useDropdownSelection();
  if (!track?.layerDefinitions?.length || track.degraded || !track.enabled) {
    return null;
  }
  const currentLayer = track.layerDefinitions.find((layer: HMSSimulcastLayerDefinition) => layer.layer === track.layer);
  const dragClassName = getDragClassName();
  return (
    <Fragment>
      <StyledMenuTile.ItemButton className={dragClassName} css={{ color: '$on_surface_medium', cursor: 'default' }}>
        Select maximum resolution
      </StyledMenuTile.ItemButton>
      {track.layerDefinitions.map((layer: HMSSimulcastLayerDefinition) => {
        return (
          <StyledMenuTile.ItemButton
            className={dragClassName}
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
                color: track.preferredLayer === layer.layer ? '$on_primary_high' : '$on_surface_high',
              }}
            >
              {layer.layer}
            </Text>
            <Text
              as="span"
              variant="xs"
              css={{
                color: track.preferredLayer === layer.layer ? '$on_primary_high' : '$on_surface_high',
              }}
            >
              {layer.resolution.width}x{layer.resolution.height}
            </Text>
          </StyledMenuTile.ItemButton>
        );
      })}
      <StyledMenuTile.ItemButton className={dragClassName}>
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

export const TileMenuContent = ({
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
}: {
  videoTrackID: string;
  audioTrackID: string;
  isLocal: boolean;
  isScreenshare: boolean;
  showSpotlight: boolean;
  showPinAction: boolean;
  peerID: string;
  canMinimise?: boolean;
  closeSheetOnClick?: () => void;
  openNameChangeModal?: () => void;
}) => {
  const actions = useHMSActions();
  const dragClassName = getDragClassName();
  const removeOthers: boolean | undefined = useHMSStore(selectPermissions)?.removeOthers;
  const { userName } = useHMSPrebuiltContext();

  const { isAudioEnabled, isVideoEnabled, setVolume, toggleAudio, toggleVideo, volume } = useRemoteAVToggle(
    audioTrackID,
    videoTrackID,
  );

  const { sendEvent } = useCustomEvent({
    type: REMOTE_STOP_SCREENSHARE_TYPE,
  });

  const isMobile = useMedia(cssConfig.media.md);

  if (isLocal) {
    return showPinAction || canMinimise || !userName || showSpotlight ? (
      <>
        {showPinAction && <PinActions audioTrackID={audioTrackID} videoTrackID={videoTrackID} />}
        {showSpotlight && <SpotlightActions peerId={peerID} onSpotLightClick={() => closeSheetOnClick()} />}
        {canMinimise && <MinimiseInset />}
        {!userName && (
          <StyledMenuTile.ItemButton
            className={dragClassName}
            onClick={() => {
              openNameChangeModal();
              closeSheetOnClick();
            }}
          >
            <PencilIcon height={20} width={20} />
            <Text variant="sm" css={{ '@md': { fontWeight: '$semiBold' }, c: '$on_surface_high' }}>
              Change Name
            </Text>
          </StyledMenuTile.ItemButton>
        )}
      </>
    ) : null;
  }

  return (
    <>
      {toggleVideo ? (
        <StyledMenuTile.ItemButton
          className={dragClassName}
          css={spacingCSS}
          onClick={() => {
            toggleVideo();
            closeSheetOnClick();
          }}
          data-testid={isVideoEnabled ? 'mute_video_participant_btn' : 'unmute_video_participant_btn'}
        >
          {isVideoEnabled ? <VideoOnIcon height={20} width={20} /> : <VideoOffIcon height={20} width={20} />}
          <span>{isVideoEnabled ? 'Mute' : 'Request Unmute'}</span>
        </StyledMenuTile.ItemButton>
      ) : null}

      {toggleAudio ? (
        <StyledMenuTile.ItemButton
          css={spacingCSS}
          className={dragClassName}
          onClick={() => {
            toggleAudio();
            closeSheetOnClick();
          }}
          data-testid={isAudioEnabled ? 'mute_audio_participant_btn' : 'unmute_audio_participant_btn'}
        >
          {isAudioEnabled ? <MicOnIcon height={20} width={20} /> : <MicOffIcon height={20} width={20} />}
          <span>{isAudioEnabled ? 'Mute' : 'Request Unmute'}</span>
        </StyledMenuTile.ItemButton>
      ) : null}

      {audioTrackID ? (
        <StyledMenuTile.VolumeItem data-testid="participant_volume_slider" css={{ ...spacingCSS, mb: '$0' }}>
          <Flex align="center" gap={1}>
            <SpeakerIcon height={20} width={20} />
            <Box as="span" css={{ ml: '$4' }}>
              Volume ({volume})
            </Box>
          </Flex>
          <Slider
            css={{ my: '0.5rem' }}
            step={5}
            value={[typeof volume === 'number' ? volume : 100]}
            onValueChange={e => setVolume?.(e[0])}
          />
        </StyledMenuTile.VolumeItem>
      ) : null}

      {showPinAction && (
        <>
          <PinActions audioTrackID={audioTrackID} videoTrackID={videoTrackID} />
          {showSpotlight && <SpotlightActions peerId={peerID} onSpotLightClick={() => closeSheetOnClick()} />}
        </>
      )}

      {isMobile ? null : <SimulcastLayers trackId={videoTrackID} />}

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
          <RemoveUserIcon height={20} width={20} />
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
          <ShareScreenIcon height={20} width={20} />
          <span>Stop Screenshare</span>
        </StyledMenuTile.RemoveItem>
      ) : null}
    </>
  );
};
