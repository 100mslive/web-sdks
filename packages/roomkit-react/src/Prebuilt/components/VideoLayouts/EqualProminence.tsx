import React, { useEffect, useMemo, useState } from 'react';
import { useMedia } from 'react-use';
import { selectLocalPeer, useHMSStore } from '@100mslive/react-sdk';
import { Flex } from '../../../Layout';
import { config as cssConfig } from '../../../Theme';
import { InsetTile } from '../InsetView';
import { Pagination } from '../Pagination';
import { Grid } from './Grid';
import { LayoutProps } from './interface';
import { useInsetEnabled } from '../../provider/roomLayoutProvider/hooks/useInsetEnabled';
// @ts-ignore: No implicit Any
import { useUISettings } from '../AppData/useUISettings';
import { usePagesWithTiles, useTileLayout } from '../hooks/useTileLayout';
// @ts-ignore: No implicit Any
import { UI_SETTINGS } from '../../common/constants';

export function EqualProminence({ peers, onPageChange, onPageSize }: LayoutProps) {
  const isInsetEnabled = useInsetEnabled();
  const localPeer = useHMSStore(selectLocalPeer);
  const isMobile = useMedia(cssConfig.media.md);
  let maxTileCount = useUISettings(UI_SETTINGS.maxTileCount);
  maxTileCount = isMobile ? Math.min(maxTileCount, 6) : maxTileCount;
  const inputPeers = useMemo(() => (peers.length === 0 ? (!localPeer ? [] : [localPeer]) : peers), [peers, localPeer]);
  const pageList = usePagesWithTiles({
    peers: inputPeers,
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
    <Flex direction="column" css={{ flex: '1 1 0', h: '100%', position: 'relative', minWidth: 0 }}>
      <Grid tiles={pagesWithTiles[page]} ref={ref} />
      <Pagination
        page={page}
        onPageChange={page => {
          setPage(page);
          onPageChange?.(page);
        }}
        numPages={pagesWithTiles.length}
      />
      {isInsetEnabled && pageList.length > 0 && pageList[0][0].peer.id !== localPeer?.id && <InsetTile />}
    </Flex>
  );
}
