import React, { useEffect, useState } from 'react';
import { selectLocalPeer, useHMSStore } from '@100mslive/react-sdk';
import { config as cssConfig } from '../../../Theme';
import { InsetTile } from '../InsetTile';
import { Pagination } from '../Pagination';
import { SecondaryTiles } from '../SecondaryTiles';
import { Grid } from './Grid';
import { LayoutProps } from './interface';
import { ProminenceLayout } from './ProminenceLayout';
// @ts-ignore: No implicit Any
import { useUISettings } from '../AppData/useUISettings';
import { useContainerQuery } from '../hooks/useContainerQuery';
import { useRoleProminencePeers } from '../hooks/useRoleProminencePeers';
import { usePagesWithTiles, useTileLayout } from '../hooks/useTileLayout';
import { UI_SETTINGS } from '../../common/constants';

export function RoleProminence({
  isInsetEnabled = false,
  prominentRoles = [],
  peers,
  onPageChange,
  onPageSize,
  edgeToEdge,
}: LayoutProps) {
  const { prominentPeers, secondaryPeers } = useRoleProminencePeers(prominentRoles, peers, isInsetEnabled);
  const localPeer = useHMSStore(selectLocalPeer);
  const isMobile = useContainerQuery(cssConfig.media.md);
  let maxTileCount = useUISettings(UI_SETTINGS.maxTileCount);
  maxTileCount = isMobile ? 4 : maxTileCount;
  const pageList = usePagesWithTiles({
    peers: prominentPeers,
    maxTileCount,
  });
  const { ref, pagesWithTiles } = useTileLayout({
    pageList,
    maxTileCount,
  });
  const [page, setPage] = useState(0);
  const pageSize = pagesWithTiles[0]?.length || 0;

  useEffect(() => {
    if (pageSize > 0) {
      onPageSize?.(pageSize);
    }
  }, [pageSize, onPageSize]);

  return (
    <ProminenceLayout.Root>
      <ProminenceLayout.ProminentSection>
        <Grid ref={ref} tiles={pagesWithTiles[page]} />
      </ProminenceLayout.ProminentSection>
      {!edgeToEdge && (
        <Pagination
          page={page}
          onPageChange={page => {
            setPage(page);
            onPageChange?.(page);
          }}
          numPages={pagesWithTiles.length}
        />
      )}
      <SecondaryTiles peers={secondaryPeers} isInsetEnabled={isInsetEnabled} edgeToEdge={edgeToEdge} />
      {isInsetEnabled && localPeer && prominentPeers.length > 0 && !prominentPeers.includes(localPeer) && <InsetTile />}
    </ProminenceLayout.Root>
  );
}
