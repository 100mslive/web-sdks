import React from 'react';
import { useVideoList, HMSPeer } from '@100mslive/react-sdk';
import { StyledVideoList } from './StyledVideoList';
import { VideoTile } from '../VideoTile';
import { Pagination } from '../Pagination';

interface Props {
  peers: HMSPeer[];
  maxTileCount?: number;
}

export const VideoList: React.FC<Props> = ({ peers, maxTileCount = 4 }) => {
  const { ref, pagesWithTiles } = useVideoList({
    peers,
    maxTileCount,
  });
  const [page, setPage] = React.useState(0);
  React.useEffect(() => {
    // currentPageIndex should not exceed pages length
    if (page >= pagesWithTiles.length) {
      setPage(0);
    }
  }, [pagesWithTiles.length, page]);
  return (
    <StyledVideoList.Root>
      <StyledVideoList.Container ref={ref}>
        {pagesWithTiles && pagesWithTiles.length > 0
          ? pagesWithTiles.map((tile, pageNo) => (
              <StyledVideoList.View
                css={{ left: getLeft(pageNo, page), transition: 'left 0.3s ease-in-out' }}
                key={pageNo}
              >
                {tile.map(tile => (
                  <VideoTile key={tile.peer.id} width={tile.width} height={tile.height} peerId={tile.peer.id} />
                ))}
              </StyledVideoList.View>
            ))
          : null}
      </StyledVideoList.Container>
      {pagesWithTiles.length > 1 ? <Pagination page={page} setPage={setPage} numPages={pagesWithTiles.length} /> : null}
    </StyledVideoList.Root>
  );
};

export const getLeft = (index: number, currentPageIndex: number) => {
  //active slide
  if (index === currentPageIndex) {
    return 0;
  }
  //prev slide
  if (index + 1 === currentPageIndex) {
    return '-100%';
  }
  //next slide
  if (index - 1 === currentPageIndex) {
    return '100%';
  }
  //all slides before prev
  if (index < currentPageIndex) {
    return '-200%';
  }
  //all slides after next
  return '200%';
};
