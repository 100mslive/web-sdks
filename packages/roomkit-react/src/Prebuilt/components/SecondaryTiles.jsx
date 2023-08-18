import React, { useEffect, useMemo, useState } from 'react';
import { useMedia } from 'react-use';
import { useHMSVanillaStore } from '@100mslive/react-sdk';
import { Flex } from '../../Layout';
import { config as cssConfig } from '../../Theme';
import { Pagination } from './Pagination';
import VideoTile from './VideoTile';
import { usePagesWithTiles } from './hooks/useTileLayout';
import PeersSorter from '../common/PeersSorter';

export const SecondaryTiles = ({ peers }) => {
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
    <Flex direction="column" css={{ flexShrink: 0 }}>
      <Flex justify="center" align="center" css={{ gap: '$4' }}>
        {pagesWithTiles[page]?.map(tile => {
          return (
            <VideoTile
              key={tile.track?.id || tile.peer?.id}
              width={tile.width}
              height="100%"
              peerId={tile.peer?.id}
              trackId={tile.track?.id}
              rootCSS={{ padding: 0, aspectRatio: isMobile ? 1 : 16 / 9 }}
              objectFit="contain"
            />
          );
        })}
      </Flex>
      {pagesWithTiles.length > 1 && <Pagination page={page} onPageChange={setPage} numPages={pagesWithTiles.length} />}
    </Flex>
  );
};
