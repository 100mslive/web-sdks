import React, { Fragment, useState } from 'react';
import { useMedia } from 'react-use';
import {
  selectLocalPeerID,
  selectPeerNameByID,
  selectPermissions,
  selectSessionStore,
  selectTemplateAppData,
  selectTrackByID,
  selectVideoTrackByPeerID,
  useHMSActions,
  useHMSStore,
  useRemoteAVToggle,
} from '@100mslive/react-sdk';
import { CrossIcon, HorizontalMenuIcon, PinIcon, StarIcon } from '@100mslive/react-icons';
import { Box } from '../../../Layout';
import { Sheet } from '../../../Sheet';
import { Text } from '../../../Text';
import { config as cssConfig } from '../../../Theme';
import { StyledMenuTile } from '../../../TileMenu';
import { ToastManager } from '../Toast/ToastManager';
import { TileMenuContent } from './TileMenuContent';
import { useSetAppDataByKey } from '../AppData/useUISettings';
import { useDropdownList } from '../hooks/useDropdownList';
import { useDropdownSelection } from '../hooks/useDropdownSelection';
import { useIsFeatureEnabled } from '../hooks/useFeatures';
import { APP_DATA, FEATURE_LIST, SESSION_STORE_KEY } from '../../common/constants';

const isSameTile = ({ trackId, videoTrackID, audioTrackID }) =>
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

/**
 * Taking peerID as peer won't necesarilly have tracks
 */
const TileMenu = ({ audioTrackID, videoTrackID, peerID, isScreenshare = false }) => {
  const [open, setOpen] = useState(false);
  const localPeerID = useHMSStore(selectLocalPeerID);
  const isLocal = localPeerID === peerID;
  const { removeOthers, changeRole } = useHMSStore(selectPermissions);
  const { setVolume, toggleAudio, toggleVideo } = useRemoteAVToggle(audioTrackID, videoTrackID);
  const showSpotlight = changeRole;

  const isPrimaryVideoTrack = useHMSStore(selectVideoTrackByPeerID(peerID))?.id === videoTrackID;
  const uiMode = useHMSStore(selectTemplateAppData).uiMode;
  const isInset = uiMode === 'inset';

  const isPinEnabled = useIsFeatureEnabled(FEATURE_LIST.PIN_TILE);
  const showPinAction = isPinEnabled && (audioTrackID || (videoTrackID && isPrimaryVideoTrack)) && !isInset;

  const track = useHMSStore(selectTrackByID(videoTrackID));
  const hideSimulcastLayers = !track?.layerDefinitions?.length || track.degraded || !track.enabled;
  const isMobile = useMedia(cssConfig.media.md);
  const peerName = useHMSStore(selectPeerNameByID(peerID));

  useDropdownList({ open, name: 'TileMenu' });

  if (!(removeOthers || toggleAudio || toggleVideo || setVolume || showPinAction) && hideSimulcastLayers) {
    return null;
  }

  if (isInset && isLocal) {
    return null;
  }
  const props = {
    isLocal,
    isScreenshare,
    audioTrackID,
    videoTrackID,
    peerID,
    isPrimaryVideoTrack,
    showSpotlight,
    showPinAction,
    pinActions: PinActions,
    spotlightActions: SpotlightActions,
    simulcastLayers: SimulcastLayers,
    spacingCSS,
  };

  return (
    <StyledMenuTile.Root open={open} onOpenChange={setOpen}>
      <StyledMenuTile.Trigger data-testid="participant_menu_btn" onClick={e => e.stopPropagation()}>
        <HorizontalMenuIcon />
      </StyledMenuTile.Trigger>

      {isMobile ? (
        <Sheet.Root open={open} onOpenChange={setOpen}>
          <Sheet.Content css={{ bg: '$surface_dim', pt: '$8' }}>
            <Text
              css={{
                color: '$on_surface_high',
                display: 'flex',
                w: '100%',
                justifyContent: 'space-between',
                alignItems: 'center',
                px: '$10',
                pb: '$8',
                fontWeight: '$semiBold',
                borderBottom: '1px solid $border_default',
              }}
            >
              {peerName}
              {isLocal ? ` (You)` : null}
              <Sheet.Close css={{ color: 'inherit' }}>
                <CrossIcon />
              </Sheet.Close>
            </Text>
            <Box css={{ px: '$8' }}>
              <TileMenuContent {...props} closeSheetOnClick={() => setOpen(false)} />
            </Box>
          </Sheet.Content>
        </Sheet.Root>
      ) : (
        <StyledMenuTile.Content side="top" align="end">
          <TileMenuContent {...props} />
        </StyledMenuTile.Content>
      )}
    </StyledMenuTile.Root>
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

export default TileMenu;
