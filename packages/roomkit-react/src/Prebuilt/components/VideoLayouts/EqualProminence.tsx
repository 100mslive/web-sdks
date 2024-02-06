import React, { useEffect, useMemo, useState } from 'react';
import { useMedia } from 'react-use';
import { selectLocalPeer, useHMSStore } from '@100mslive/react-sdk';
import { Flex } from '../../../Layout';
import { config as cssConfig } from '../../../Theme';
import { InsetTile } from '../InsetTile';
import { Pagination } from '../Pagination';
import { Grid } from './Grid';
import { LayoutProps } from './interface';
// @ts-ignore: No implicit Any
import { useUISettings } from '../AppData/useUISettings';
import { usePagesWithTiles, useTileLayout } from '../hooks/useTileLayout';
import { UI_SETTINGS } from '../../common/constants';

export function EqualProminence({ isInsetEnabled = false, peers, onPageChange, onPageSize, edgeToEdge }: LayoutProps) {
  const localPeer = useHMSStore(selectLocalPeer);
  const isMobile = useMedia(cssConfig.media.md);
  let maxTileCount = useUISettings(UI_SETTINGS.maxTileCount);
  maxTileCount = isMobile ? Math.min(maxTileCount, 6) : maxTileCount;
  let pageList = usePagesWithTiles({
    peers,
    maxTileCount,
  });
  // useMemo is needed to prevent recursion as new array is created for localPeer
  const inputPeers = useMemo(() => {
    if (pageList.length === 0) {
      return localPeer ? [localPeer] : [];
    }
    return peers;
  }, [pageList.length, peers, localPeer]);
  // Pass local peer to main grid if no other peer has tiles
  pageList = usePagesWithTiles({
    peers: inputPeers,
    maxTileCount,
  });
  const { ref, pagesWithTiles } = useTileLayout({
    pageList,
    maxTileCount,
    edgeToEdge,
  });
  const [page, setPage] = useState(0);
  const pageSize = pagesWithTiles[0]?.length || 0;

  useEffect(() => {
    if (pageSize > 0) {
      onPageSize?.(pageSize);
    }
  }, [pageSize, onPageSize]);

  return (
    <Flex direction="column" css={{ flex: '1 1 0', h: '100%', position: 'relative', minWidth: 0 }}>
      <Grid tiles={pagesWithTiles[page]} ref={ref} edgeToEdge={edgeToEdge} />
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
      {isInsetEnabled && pageList.length > 0 && pageList[0][0].peer.id !== localPeer?.id && <InsetTile />}
    </Flex>
  );
}
