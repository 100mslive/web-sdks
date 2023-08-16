import React, { useEffect, useMemo, useState } from 'react';
import { useMedia } from 'react-use';
import { selectLocalPeer, selectRemotePeers, useHMSStore, useHMSVanillaStore } from '@100mslive/react-sdk';
import { Box, Flex } from '../../Layout';
import { config as cssConfig } from '../../Theme';
import { InsetTile } from '../layouts/InsetView';
import { Pagination } from './Pagination';
import VideoTile from './VideoTile';
import { useUISettings } from './AppData/useUISettings';
import { useTileLayout } from './hooks/useTileLayout';
import PeersSorter from '../common/PeersSorter';
import { UI_SETTINGS } from '../common/constants';

export function EqualProminence() {
  const peers = useHMSStore(selectRemotePeers);
  const [sortedPeers, setSortedPeers] = useState(peers);
  const localPeer = useHMSStore(selectLocalPeer);
  const vanillaStore = useHMSVanillaStore();
  const isMobile = useMedia(cssConfig.media.md);
  let maxTileCount = useUISettings(UI_SETTINGS.maxTileCount);
  maxTileCount = isMobile ? Math.min(maxTileCount, 6) : maxTileCount;
  const { ref, pagesWithTiles } = useTileLayout({
    peers: sortedPeers.length === 0 ? [localPeer] : sortedPeers,
    maxTileCount,
  });
  const [page, setPage] = useState(0);
  const peersSorter = useMemo(() => new PeersSorter(vanillaStore), [vanillaStore]);
  const pageSize = pagesWithTiles[0]?.length;

  useEffect(() => {
    if (page !== 0) {
      return;
    }
    peersSorter.setPeersAndTilesPerPage({
      peers,
      tilesPerPage: pageSize || maxTileCount,
    });
    peersSorter.onUpdate(setSortedPeers);
  }, [page, peersSorter, peers, pageSize, maxTileCount]);

  return (
    <Flex direction="column" css={{ flex: '1 1 0', h: '100%', position: 'relative', minWidth: 0 }}>
      <Box
        ref={ref}
        css={{
          flex: '1 1 0',
          gap: '$4',
          display: 'flex',
          placeContent: 'center',
          alignItems: 'center',
          justifyContent: 'center',
          flexFlow: 'row wrap',
          minHeight: 0,
        }}
      >
        {pagesWithTiles[page]?.map(tile => {
          return (
            <VideoTile
              key={tile.track?.id || tile.peer?.id}
              width={tile.width}
              height={tile.height}
              peerId={tile.peer?.id}
              trackId={tile.track?.id}
              rootCSS={{ padding: 0 }}
              objectFit="contain"
            />
          );
        })}
      </Box>
      {pagesWithTiles.length > 1 && <Pagination page={page} onPageChange={setPage} numPages={pagesWithTiles.length} />}
      {peers.length > 0 && <InsetTile />}
    </Flex>
  );
}
