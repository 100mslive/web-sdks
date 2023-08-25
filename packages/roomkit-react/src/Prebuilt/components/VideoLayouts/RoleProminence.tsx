import React, { useEffect, useState } from 'react';
import { selectLocalPeer, useHMSStore } from '@100mslive/react-sdk';
import { InsetTile } from '../InsetView';
import { Pagination } from '../Pagination';
import { SecondaryTiles } from '../SecondaryTiles';
import { Grid } from './Grid';
import { LayoutProps } from './interface';
import { RoleProminenceLayout } from './RoleProminenceLayout';
import { usePeerPartition } from '../hooks/usePeerPartition';
import { usePagesWithTiles, useTileLayout } from '../hooks/useTileLayout';

export function RoleProminence({ peers, onPageChange, onPageSize }: LayoutProps) {
  const { prominentPeers, secondaryPeers, isInsetEnabled } = usePeerPartition(peers);
  const localPeer = useHMSStore(selectLocalPeer);
  const maxTileCount = 4;
  const pageList = usePagesWithTiles({
    peers,
    maxTileCount,
  });
  const { ref, pagesWithTiles } = useTileLayout({
    pageList,
    maxTileCount,
  });
  const [page, setPage] = useState(0);
  const pageSize = pagesWithTiles[0]?.length || 0;

  useEffect(() => {
    onPageSize?.(pageSize);
  }, [pageSize, onPageSize]);

  return (
    <RoleProminenceLayout.Root>
      <RoleProminenceLayout.ProminentSection>
        <Grid ref={ref} tiles={pagesWithTiles[page]} />
      </RoleProminenceLayout.ProminentSection>
      <Pagination
        page={page}
        onPageChange={page => {
          setPage(page);
          onPageChange?.(page);
        }}
        numPages={pagesWithTiles.length}
      />
      <SecondaryTiles peers={secondaryPeers} />
      {isInsetEnabled && localPeer && !prominentPeers.includes(localPeer) && <InsetTile />}
    </RoleProminenceLayout.Root>
  );
}
