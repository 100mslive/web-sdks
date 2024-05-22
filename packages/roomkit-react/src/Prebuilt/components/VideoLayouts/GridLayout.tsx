import React, { useEffect, useMemo, useState } from 'react';
import { GridVideoTileLayout } from '@100mslive/types-prebuilt/elements/video_tile_layout';
import { match } from 'ts-pattern';
import {
  HMSTranscriptionInfo,
  HMSTranscriptionState,
  selectLocalPeerID,
  selectLocalPeerRoleName,
  selectPeers,
  selectPeerScreenSharing,
  selectTranscriptionsState,
  selectWhiteboard,
  useHMSStore,
  useHMSVanillaStore,
} from '@100mslive/react-sdk';
import { AlertTriangleIcon } from '@100mslive/react-icons';
// @ts-ignore: No implicit Any
import { ToastManager } from '../Toast/ToastManager';
import { EqualProminence } from './EqualProminence';
import { RoleProminence } from './RoleProminence';
import { ScreenshareLayout } from './ScreenshareLayout';
import { WhiteboardLayout } from './WhiteboardLayout';
// @ts-ignore: No implicit Any
import { usePinnedTrack, useSetAppDataByKey } from '../AppData/useUISettings';
import { VideoTileContext } from '../hooks/useVideoTileLayout';
import PeersSorter from '../../common/PeersSorter';
import { APP_DATA } from '../../common/constants';

export type TileCustomisationProps = {
  hide_participant_name_on_tile: boolean;
  rounded_video_tile: boolean;
  hide_audio_mute_on_tile: boolean;
  video_object_fit: 'contain' | 'cover';
  edge_to_edge: boolean;
  hide_metadata_on_tile: boolean;
};

export type GridLayoutProps = GridVideoTileLayout & TileCustomisationProps;

export const GridLayout = ({
  enable_local_tile_inset: isInsetEnabled = false,
  prominent_roles: prominentRoles = [],
  enable_spotlighting_peer = false,
  hide_participant_name_on_tile = false,
  rounded_video_tile = true,
  hide_audio_mute_on_tile = false,
  video_object_fit = 'contain',
  edge_to_edge = false,
  hide_metadata_on_tile = false,
}: GridLayoutProps) => {
  const peerSharing = useHMSStore(selectPeerScreenSharing);
  const whiteboard = useHMSStore(selectWhiteboard);
  const pinnedTrack = usePinnedTrack();
  const peers = useHMSStore(selectPeers);
  const localPeerRole = useHMSStore(selectLocalPeerRoleName);
  const localPeerID = useHMSStore(selectLocalPeerID);

  const [activeScreensharePeerId] = useSetAppDataByKey(APP_DATA.activeScreensharePeerId);
  const isRoleProminence =
    (prominentRoles.length &&
      peers.some(
        peer => peer.roleName && prominentRoles.includes(peer.roleName) && (peer.videoTrack || peer.audioTrack),
      )) ||
    pinnedTrack;
  const updatedPeers = useMemo(() => {
    // remove screenshare/whiteboard peer from active speaker sorting
    if (activeScreensharePeerId || whiteboard?.open) {
      return peers.filter(peer => peer.id !== activeScreensharePeerId || peer.customerUserId !== whiteboard?.owner);
    }
    if (isInsetEnabled) {
      const isLocalPeerPinned = localPeerID === pinnedTrack?.peerId;
      // if localPeer role is prominent role, it shows up in the center or local peer is pinned, so allow it in active speaker sorting
      if ((localPeerRole && prominentRoles.includes(localPeerRole)) || isLocalPeerPinned) {
        return peers;
      } else {
        return peers.filter(peer => !peer.isLocal);
      }
    }
    return peers;
  }, [
    isInsetEnabled,
    whiteboard,
    activeScreensharePeerId,
    localPeerRole,
    localPeerID,
    prominentRoles,
    peers,
    pinnedTrack,
  ]);
  const vanillaStore = useHMSVanillaStore();
  const [sortedPeers, setSortedPeers] = useState(updatedPeers);
  const peersSorter = useMemo(() => new PeersSorter(vanillaStore), [vanillaStore]);
  const [pageSize, setPageSize] = useState(0);
  const [mainPage, setMainPage] = useState(0);
  const tileLayout = {
    enableSpotlightingPeer: enable_spotlighting_peer,
    hideParticipantNameOnTile: hide_participant_name_on_tile,
    roundedVideoTile: rounded_video_tile,
    hideAudioMuteOnTile: hide_audio_mute_on_tile,
    hideMetadataOnTile: hide_metadata_on_tile,
    objectFit: video_object_fit,
  };

  const transcriptionStates: HMSTranscriptionInfo[] | undefined = useHMSStore(selectTranscriptionsState);

  useEffect(() => {
    console.log('transcription state', transcriptionStates);
    if (transcriptionStates && transcriptionStates.length > 0) {
      match({ state: transcriptionStates[0].state, error: transcriptionStates[0].error })
        .when(
          ({ error }) => error,
          () => {
            ToastManager.addToast({
              title: `Failed to enable Closed Caption`,
              variant: 'danger',
              icon: <AlertTriangleIcon style={{ marginRight: '0.5rem' }} />,
            });
          },
        )
        .when(
          ({ state }) => state === HMSTranscriptionState.Started,
          () => {
            ToastManager.addToast({
              title: `Failed to enable Closed Caption`,
              variant: 'danger',
              icon: <AlertTriangleIcon style={{ marginRight: '0.5rem' }} />,
            });
          },
        )
        .when(
          ({ state }) => state === HMSTranscriptionState.STOPPED || state === HMSTranscriptionState.FAILED,
          () => {
            ToastManager.addToast({
              title: `Failed to enable Closed Caption`,
              variant: 'danger',
              icon: <AlertTriangleIcon style={{ marginRight: '0.5rem' }} />,
            });
          },
        );
    }
  }, [transcriptionStates]);

  useEffect(() => {
    if (mainPage !== 0) {
      return;
    }
    peersSorter.setPeersAndTilesPerPage({
      peers: updatedPeers,
      tilesPerPage: pageSize,
    });
    peersSorter.onUpdate(setSortedPeers);
  }, [mainPage, peersSorter, updatedPeers, pageSize]);

  if (peerSharing) {
    return (
      <VideoTileContext.Provider value={tileLayout}>
        <ScreenshareLayout
          peers={sortedPeers}
          onPageSize={setPageSize}
          onPageChange={setMainPage}
          edgeToEdge={edge_to_edge}
        />
      </VideoTileContext.Provider>
    );
  } else if (whiteboard?.open) {
    return (
      <VideoTileContext.Provider value={tileLayout}>
        <WhiteboardLayout
          peers={sortedPeers}
          onPageSize={setPageSize}
          onPageChange={setMainPage}
          edgeToEdge={edge_to_edge}
        />
      </VideoTileContext.Provider>
    );
  } else if (isRoleProminence) {
    return (
      <VideoTileContext.Provider value={tileLayout}>
        <RoleProminence
          peers={sortedPeers}
          onPageSize={setPageSize}
          onPageChange={setMainPage}
          prominentRoles={prominentRoles}
          isInsetEnabled={isInsetEnabled}
          edgeToEdge={edge_to_edge}
        />
      </VideoTileContext.Provider>
    );
  }
  return (
    <VideoTileContext.Provider value={tileLayout}>
      <EqualProminence
        peers={sortedPeers}
        onPageSize={setPageSize}
        onPageChange={setMainPage}
        isInsetEnabled={isInsetEnabled}
        edgeToEdge={edge_to_edge}
      />
    </VideoTileContext.Provider>
  );
};
