import React, { useState } from 'react';
import { useMedia } from 'react-use';
import { Flex } from '../../Layout';
import { config as cssConfig } from '../../Theme';
import { Pagination } from './Pagination';
import VideoTile from './VideoTile';
import { usePagesWithTiles } from './hooks/useTileLayout';

export const SecondaryTiles = ({ peers }) => {
  const isMobile = useMedia(cssConfig.media.md);
  const pagesWithTiles = usePagesWithTiles({ peers, maxTileCount: isMobile ? 2 : 4 });
  const [page, setPage] = useState(0);

  return (
    <Flex direction="column">
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
