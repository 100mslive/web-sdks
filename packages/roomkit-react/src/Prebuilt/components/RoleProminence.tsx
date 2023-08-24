import React, { useEffect, useMemo, useState } from 'react';
import { selectPeers, useHMSStore, useHMSVanillaStore } from '@100mslive/react-sdk';
import { Grid } from './VideoLayouts/Grid';
import { RoleProminenceLayout } from './VideoLayouts/RoleProminenceLayout';
import { InsetTile } from './InsetView';
import { Pagination } from './Pagination';
// @ts-ignore: No implicit Any
import { SecondaryTiles } from './SecondaryTiles';
import { useRoleProminence } from './hooks/useRoleProminence';
import { useTileLayout } from './hooks/useTileLayout';
// @ts-ignore: No implicit Any
import PeersSorter from '../common/PeersSorter';

export function RoleProminence() {
  const peers = useHMSStore(selectPeers);
  const { prominentPeers, secondaryPeers, isInsetEnabled } = useRoleProminence(peers);
  const [sortedPeers, setSortedPeers] = useState(prominentPeers);
  const vanillaStore = useHMSVanillaStore();
  const maxTileCount = 4;
  const { ref, pagesWithTiles } = useTileLayout({
    peers: sortedPeers,
    maxTileCount: 4,
  });
  const peersSorter = useMemo(() => new PeersSorter(vanillaStore), [vanillaStore]);
  const pageSize = pagesWithTiles[0]?.length;
  const [page, setPage] = useState(0);

  useEffect(() => {
    if (page !== 0) {
      return;
    }
    peersSorter.setPeersAndTilesPerPage({
      peers: prominentPeers,
      tilesPerPage: pageSize || maxTileCount,
    });
    peersSorter.onUpdate(setSortedPeers);
  }, [page, peersSorter, prominentPeers, pageSize, maxTileCount]);

  return (
    <RoleProminenceLayout.Root>
      <RoleProminenceLayout.ProminentSection>
        <Grid ref={ref} tiles={pagesWithTiles[page]} />
      </RoleProminenceLayout.ProminentSection>
      <Pagination page={page} onPageChange={setPage} numPages={pagesWithTiles.length} />
      <SecondaryTiles peers={secondaryPeers} />
      {isInsetEnabled && <InsetTile />}
    </RoleProminenceLayout.Root>
  );
}
