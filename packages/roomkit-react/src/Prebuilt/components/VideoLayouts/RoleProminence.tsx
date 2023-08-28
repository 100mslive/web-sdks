import React, { useEffect, useState } from 'react';
import { selectLocalPeer, useHMSStore } from '@100mslive/react-sdk';
import { InsetTile } from '../InsetTile';
import { Pagination } from '../Pagination';
import { SecondaryTiles } from '../SecondaryTiles';
import { Grid } from './Grid';
import { LayoutProps } from './interface';
import { ProminenceLayout } from './ProminenceLayout';
import { useRoleProminencePeers } from '../hooks/useRoleProminencePeers';
import { usePagesWithTiles, useTileLayout } from '../hooks/useTileLayout';

export function RoleProminence({ peers, onPageChange, onPageSize }: LayoutProps) {
  const { prominentPeers, secondaryPeers, isInsetEnabled } = useRoleProminencePeers(peers);
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
    <ProminenceLayout.Root>
      <ProminenceLayout.ProminentSection>
        <Grid ref={ref} tiles={pagesWithTiles[page]} />
      </ProminenceLayout.ProminentSection>
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
    </ProminenceLayout.Root>
  );
}
