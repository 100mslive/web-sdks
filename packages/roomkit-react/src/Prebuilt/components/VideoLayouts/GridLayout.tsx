import React, { useEffect, useMemo, useState } from 'react';
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
import { useInsetEnabled } from '../../provider/roomLayoutProvider/hooks/useInsetEnabled';
import { useIsRoleProminenceLayout } from '../../provider/roomLayoutProvider/hooks/useIsRoleProminenceLayout';
import PeersSorter from '../../common/PeersSorter';

export const GridLayout = () => {
  const peerSharing = useHMSStore(selectPeerScreenSharing);
  const isRoleProminence = useIsRoleProminenceLayout();
  const isInsetEnabled = useInsetEnabled();
  const peers = useHMSStore(isInsetEnabled && !isRoleProminence ? selectRemotePeers : selectPeers);
  const vanillaStore = useHMSVanillaStore();
  const [sortedPeers, setSortedPeers] = useState(peers);
  const peersSorter = useMemo(() => new PeersSorter(vanillaStore), [vanillaStore]);
  const [pageSize, setPageSize] = useState(0);
  const [mainPage, setMainPage] = useState(0);

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
    return <ScreenshareLayout peers={sortedPeers} onPageSize={setPageSize} onPageChange={setMainPage} />;
  } else if (isRoleProminence) {
    return <RoleProminence peers={sortedPeers} onPageSize={setPageSize} onPageChange={setMainPage} />;
  }
  return <EqualProminence peers={sortedPeers} onPageSize={setPageSize} onPageChange={setMainPage} />;
};
