import React, { useEffect, useMemo, useState } from 'react';
import { selectPeers, useHMSStore, useHMSVanillaStore } from '@100mslive/react-sdk';
import { Box, Flex } from '../../Layout';
import { InsetTile } from '../layouts/InsetView';
import { Pagination } from './Pagination';
import { SecondaryTiles } from './SecondaryTiles';
import VideoTile from './VideoTile';
import { useRoleProminence } from './hooks/useRoleProminence';
import { useTileLayout } from './hooks/useTileLayout';
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
    <Flex direction="column" css={{ flex: '1 1 0', h: '100%', position: 'relative', minWidth: 0 }}>
      <Box
        ref={ref}
        css={{
          flex: '1 1 0',
          gap: '$4',
          py: '$4',
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
      <SecondaryTiles peers={secondaryPeers} />
      {isInsetEnabled && <InsetTile />}
    </Flex>
  );
}
