import { useVideoList, HMSPeer } from '@100mslive/react-sdk';
import { StyledVideoList } from './StyledVideoList';
import React from 'react';
import { VideoTile } from '../VideoTile';
import { Pagination } from '../Pagination';

interface Props {
  peers: HMSPeer[];
  maxTileCount?: number;
}

// TODO: set good default ask team
export const VideoList: React.FC<Props> = ({ peers, maxTileCount = 4 }) => {
  const { ref, chunkedTracksWithPeer } = useVideoList({
    peers,
    maxTileCount,
  });
  const [page, setPage] = React.useState(0);
  React.useEffect(() => {
    // currentPageIndex should not exceed pages length
    if (page >= chunkedTracksWithPeer.length) {
      setPage(0);
    }
  }, [chunkedTracksWithPeer.length, page]);
  const list = new Array(chunkedTracksWithPeer.length).fill('');
  return (
    <StyledVideoList.Root>
      <StyledVideoList.Container ref={ref}>
        {chunkedTracksWithPeer && chunkedTracksWithPeer.length > 0
          ? chunkedTracksWithPeer.map((l, i) => (
              <StyledVideoList.View css={{ left: getLeft(i, page), transition: 'left 0.3s ease-in-out' }} key={i}>
                {l.map(p => (
                  <VideoTile key={p.peer.id} width={p.width} height={p.height} peerId={p.peer.id} />
                ))}
              </StyledVideoList.View>
            ))
          : null}
      </StyledVideoList.Container>
      {chunkedTracksWithPeer.length > 1 ? <Pagination page={page} setPage={setPage} list={list} /> : null}
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
