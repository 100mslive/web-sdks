import { ComponentPropsWithoutRef, useState } from 'react';
import { useMedia } from 'react-use';
import {
  HMSAudioTrack,
  HMSVideoTrack,
  selectLocalPeerID,
  selectPeerByID,
  selectPermissions,
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
import { ChangeNameModal } from '../MoreSettings/ChangeNameModal';
import { getVideoTileLabel } from '../peerTileUtils';
import { RoleChangeModal } from '../RoleChangeModal';
import { TileMenuContent } from './TileMenuContent';
import { useDropdownList } from '../hooks/useDropdownList';
import { getDragClassName } from './utils';

/**
 * Taking peerID as peer won't necesarilly have tracks
 */
const TileMenu = ({
  audioTrackID,
  videoTrackID,
  peerID,
  isScreenshare = false,
  canMinimise,
  enableSpotlightingPeer = true,
}: {
  audioTrackID: string;
  videoTrackID: string;
  peerID: string;
  isScreenshare?: boolean;
  canMinimise?: boolean;
  enableSpotlightingPeer?: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const { theme } = useTheme();

  const localPeerID = useHMSStore(selectLocalPeerID);
  const isLocal = localPeerID === peerID;
  const { removeOthers } = useHMSStore(selectPermissions) || {};
  const { setVolume, toggleAudio, toggleVideo } = useRemoteAVToggle(audioTrackID, videoTrackID);
  const showSpotlight = enableSpotlightingPeer;

  const isPrimaryVideoTrack = useHMSStore(selectVideoTrackByPeerID(peerID))?.id === videoTrackID;
  const showPinAction = !!(audioTrackID || (videoTrackID && isPrimaryVideoTrack));

  const track = useHMSStore(selectTrackByID(videoTrackID)) as HMSVideoTrack | null;
  const audioTrack = useHMSStore(selectTrackByID(audioTrackID)) as HMSAudioTrack | null;
  const hideSimulcastLayers = !track?.layerDefinitions?.length || track.degraded || !track.enabled;
  const isMobile = useMedia(cssConfig.media.md);
  const peer = useHMSStore(selectPeerByID(peerID));
  const [showNameChangeModal, setShowNameChangeModal] = useState(false);
  const [showRoleChangeModal, setShowRoleChangeModal] = useState(false);
  useDropdownList({ open, name: 'TileMenu' });
  const dragClassName = getDragClassName();

  if (!peer || (!(removeOthers || toggleAudio || toggleVideo || setVolume || showPinAction) && hideSimulcastLayers)) {
    return null;
  }

  const openNameChangeModal = () => setShowNameChangeModal(true);
  const openRoleChangeModal = () => setShowRoleChangeModal(true);

  const props: ComponentPropsWithoutRef<typeof TileMenuContent> = {
    isLocal,
    isScreenshare,
    audioTrackID,
    videoTrackID,
    peerID,
    showSpotlight,
    showPinAction,
    canMinimise,
    openNameChangeModal,
    openRoleChangeModal,
  };

  return (
    <>
      <StyledMenuTile.Root open={open} onOpenChange={setOpen}>
        <StyledMenuTile.Trigger
          data-testid="participant_menu_btn"
          css={{ bg: `${theme.colors.background_dim.value}A3`, p: '$2', w: 'unset', h: 'unset' }}
          onClick={e => e.stopPropagation()}
          className={dragClassName}
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
                    {getVideoTileLabel({ peerName: peer?.name, isLocal, audioTrack, videoTrack: track })}
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
              <Box css={{ px: '$8', pb: '$8', maxHeight: '80vh', overflowY: 'auto' }}>
                <TileMenuContent {...props} closeSheetOnClick={() => setOpen(false)} />
              </Box>
            </Sheet.Content>
          </Sheet.Root>
        ) : (
          <StyledMenuTile.Content side="top" align="end" css={{ maxHeight: '$80', overflowY: 'auto' }}>
            <TileMenuContent {...props} />
          </StyledMenuTile.Content>
        )}
      </StyledMenuTile.Root>
      {showNameChangeModal && <ChangeNameModal onOpenChange={setShowNameChangeModal} />}
      {showRoleChangeModal && <RoleChangeModal peerId={peerID} onOpenChange={setShowRoleChangeModal} />}
    </>
  );
};

export { isSameTile } from './TileMenuContent';

export default TileMenu;
