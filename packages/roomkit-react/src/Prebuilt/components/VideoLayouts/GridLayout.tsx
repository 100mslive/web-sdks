import React, { useEffect, useMemo, useState } from 'react';
import { GridVideoTileLayout } from '@100mslive/types-prebuilt/elements/video_tile_layout';
import {
  selectPeers,
  selectPeerScreenSharing,
  selectRemotePeers,
  useHMSStore,
  useHMSVanillaStore,
} from '@100mslive/react-sdk';
import { EqualProminence } from './EqualProminence';
import { RoleProminence } from './RoleProminence';
import { ScreenshareLayout } from './ScreenshareLayout';
// @ts-ignore: No implicit Any
import { usePinnedTrack } from '../AppData/useUISettings';
import { VideoTileContext } from '../hooks/useVideoTileLayout';
import PeersSorter from '../../common/PeersSorter';

export type GridLayoutProps = GridVideoTileLayout & {
  hide_participant_name_on_tile: boolean;
  hide_audio_level_on_tile: boolean;
  rounded_video_tile: boolean;
  hide_audio_mute_on_tile: boolean;
  video_object_fit: 'contain' | 'cover';
};

export const GridLayout = ({
  enable_local_tile_inset: isInsetEnabled = false,
  prominent_roles: prominentRoles = [],
  enable_spotlighting_peer = false,
  hide_participant_name_on_tile = false,
  rounded_video_tile = true,
  hide_audio_mute_on_tile = false,
  video_object_fit = 'contain',
}: GridLayoutProps) => {
  const peerSharing = useHMSStore(selectPeerScreenSharing);
  const pinnedTrack = usePinnedTrack();
  const isRoleProminence = prominentRoles.length > 0 || pinnedTrack;
  const peers = useHMSStore(isInsetEnabled && !isRoleProminence && !peerSharing ? selectRemotePeers : selectPeers);
  const vanillaStore = useHMSVanillaStore();
  const [sortedPeers, setSortedPeers] = useState(peers);
  const peersSorter = useMemo(() => new PeersSorter(vanillaStore), [vanillaStore]);
  const [pageSize, setPageSize] = useState(0);
  const [mainPage, setMainPage] = useState(0);
  const tileLayout = {
    enableSpotlightingPeer: enable_spotlighting_peer,
    hideParticipantNameOnTile: hide_participant_name_on_tile,
    roundedVideoTile: rounded_video_tile,
    hideAudioMuteOnTile: hide_audio_mute_on_tile,
    objectFit: video_object_fit,
  };

  useEffect(() => {
    if (mainPage !== 0) {
      return;
    }
    peersSorter.setPeersAndTilesPerPage({
      peers,
      tilesPerPage: pageSize,
    });
    peersSorter.onUpdate(setSortedPeers);
  }, [mainPage, peersSorter, peers, pageSize]);

  if (peerSharing) {
    return (
      <VideoTileContext.Provider value={tileLayout}>
        <ScreenshareLayout peers={sortedPeers} onPageSize={setPageSize} onPageChange={setMainPage} />
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
      />
    </VideoTileContext.Provider>
  );
};
