import React, { useEffect, useMemo, useState } from 'react';
import { selectPeers, useHMSStore, useHMSVanillaStore } from '@100mslive/react-sdk';
import { InsetTile } from '../InsetView';
import { Pagination } from '../Pagination';
// @ts-ignore: No implicit Any
import { SecondaryTiles } from '../SecondaryTiles';
import { Grid } from './Grid';
import { RoleProminenceLayout } from './RoleProminenceLayout';
import { usePeerPartition } from '../hooks/usePeerPartition';
import { usePagesWithTiles, useTileLayout } from '../hooks/useTileLayout';
// @ts-ignore: No implicit Any
import PeersSorter from '../../common/PeersSorter';

export function RoleProminence() {
  const peers = useHMSStore(selectPeers);
  const { prominentPeers, secondaryPeers, isInsetEnabled } = usePeerPartition(peers);
  const [sortedPeers, setSortedPeers] = useState(prominentPeers);
  const vanillaStore = useHMSVanillaStore();
  const maxTileCount = 4;
  const pageList = usePagesWithTiles({
    peers: sortedPeers,
    maxTileCount,
  });
  const { ref, pagesWithTiles } = useTileLayout({
    pageList,
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
