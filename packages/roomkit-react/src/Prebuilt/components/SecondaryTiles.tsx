import React, { useEffect, useMemo, useState } from 'react';
import { useMedia } from 'react-use';
import { HMSPeer, useHMSVanillaStore } from '@100mslive/react-sdk';
import { RoleProminenceLayout } from './VideoLayouts/RoleProminenceLayout';
import { config as cssConfig } from '../../Theme';
// @ts-ignore: No implicit Any
import { Pagination } from './Pagination';
import { usePagesWithTiles } from './hooks/useTileLayout';
// @ts-ignore: No implicit Any
import PeersSorter from '../common/PeersSorter';

export const SecondaryTiles = ({ peers }: { peers: HMSPeer[] }) => {
  const isMobile = useMedia(cssConfig.media.md);
  const maxTileCount = isMobile ? 2 : 4;
  const [sortedPeers, setSortedPeers] = useState(peers);
  const pagesWithTiles = usePagesWithTiles({ peers: sortedPeers, maxTileCount });
  const [page, setPage] = useState(0);
  const vanillaStore = useHMSVanillaStore();
  const peersSorter = useMemo(() => new PeersSorter(vanillaStore), [vanillaStore]);

  useEffect(() => {
    if (page !== 0) {
      return;
    }
    peersSorter.setPeersAndTilesPerPage({
      peers,
      tilesPerPage: maxTileCount,
    });
    peersSorter.onUpdate(setSortedPeers);
  }, [page, peers, peersSorter, maxTileCount]);

  return (
    <RoleProminenceLayout.SecondarySection tiles={pagesWithTiles[page]}>
      <Pagination page={page} onPageChange={setPage} numPages={pagesWithTiles.length} />
    </RoleProminenceLayout.SecondarySection>
  );
};
