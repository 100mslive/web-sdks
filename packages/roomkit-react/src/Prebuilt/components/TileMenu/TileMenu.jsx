import React, { useState } from 'react';
import { useMedia } from 'react-use';
import {
  selectLocalPeerID,
  selectPeerByID,
  selectPermissions,
  selectTemplateAppData,
  selectTrackByID,
  selectVideoTrackByPeerID,
  useHMSStore,
  useRemoteAVToggle,
} from '@100mslive/react-sdk';
import { CrossIcon, VerticalMenuIcon } from '@100mslive/react-icons';
import { Box, Flex } from '../../../Layout';
import { Sheet } from '../../../Sheet';
import { Text } from '../../../Text';
import { config as cssConfig, useTheme } from '../../../Theme';
import { StyledMenuTile } from '../../../TileMenu';
import { TileMenuContent } from './TileMenuContent';
import { useDropdownList } from '../hooks/useDropdownList';
import { useIsFeatureEnabled } from '../hooks/useFeatures';
import { FEATURE_LIST } from '../../common/constants';

/**
 * Taking peerID as peer won't necesarilly have tracks
 */
const TileMenu = ({ audioTrackID, videoTrackID, peerID, isScreenshare = false, canMinimise }) => {
  const [open, setOpen] = useState(false);
  const { theme } = useTheme();

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
  const peer = useHMSStore(selectPeerByID(peerID));

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
    canMinimise,
  };

  return (
    <StyledMenuTile.Root open={open} onOpenChange={setOpen}>
      <StyledMenuTile.Trigger
        data-testid="participant_menu_btn"
        css={{ bg: `${theme.colors.background_dim.value}A3` }}
        onClick={e => e.stopPropagation()}
      >
        <VerticalMenuIcon width={20} height={20} />
      </StyledMenuTile.Trigger>

      {isMobile ? (
        <Sheet.Root open={open} onOpenChange={setOpen}>
          <Sheet.Content css={{ bg: '$surface_dim', pt: '$8' }}>
            <Flex
              css={{
                color: '$on_surface_high',
                display: 'flex',
                w: '100%',
                justifyContent: 'space-between',
                alignItems: 'center',
                px: '$10',
                pb: '$8',
                borderBottom: '1px solid $border_default',
              }}
            >
              <Box>
                <Text css={{ color: '$on_surface_high', fontWeight: '$semiBold' }}>
                  {peer.name}
                  {isLocal ? ` (You)` : null}
                </Text>
                {peer?.roleName ? (
                  <Text variant="xs" css={{ color: '$on_surface_low', mt: '$2' }}>
                    {peer.roleName}
                  </Text>
                ) : null}
              </Box>

              <Sheet.Close css={{ color: 'inherit' }}>
                <CrossIcon />
              </Sheet.Close>
            </Flex>
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

export { isSameTile } from './TileMenuContent';

export default TileMenu;
