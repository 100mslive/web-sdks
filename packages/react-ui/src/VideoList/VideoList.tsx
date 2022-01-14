import { useVideoList, HMSPeer } from '@100mslive/react-sdk';
import { StyledVideoList } from './StyledVideoList';
import React from 'react';
import getLeft from './getLeft';
import { VideoTile } from '../VideoTile';
import { Pagination } from '../Pagination';

interface Props {
  peers: HMSPeer[];
}

export const VideoList: React.FC<Props> = ({ peers }) => {
  const { ref, chunkedTracksWithPeer } = useVideoList({
    peers,
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
                  <VideoTile key={p.peer.id} width={p.width} height={p.height} peer={p.peer} />
                ))}
              </StyledVideoList.View>
            ))
          : null}
      </StyledVideoList.Container>
      {chunkedTracksWithPeer.length > 1 ? <Pagination page={page} setPage={setPage} list={list} /> : null}
    </StyledVideoList.Root>
  );
};
