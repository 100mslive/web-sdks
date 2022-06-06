import React, { useEffect, useState } from 'react';
import {
  StyledVideoList,
  StyledVideoTile,
  Video,
  getLeft,
  Pagination,
  useTheme,
} from '@100mslive/react-ui';
import {
  selectPeers,
  useHMSStore,
  useVideoList,
  HMSPeer,
} from '@100mslive/react-sdk';

export default {
  title: 'Example/VideoList',
  component: StyledVideoList,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {},
};

const Template = () => {
  const peers = useHMSStore(selectPeers);
  console.log({ peers });
  const { ref, pagesWithTiles } = useVideoList({
    peers,
    maxTileCount: 4,
    offsetY: 32,
  });
  console.log({ pagesWithTiles });
  const [page, setPage] = useState(0);
  useEffect(() => {
    // currentPageIndex should not exceed pages length
    if (page >= pagesWithTiles.length) {
      setPage(0);
    }
  }, [pagesWithTiles.length, page]);
  return (
    <StyledVideoList.Root ref={ref}>
      <StyledVideoList.Container>
        {pagesWithTiles && pagesWithTiles.length > 0
          ? pagesWithTiles.map((tiles, pageNo) => (
              <StyledVideoList.View
                css={{
                  left: getLeft(pageNo, page),
                  transition: 'left 0.3s ease-in-out',
                }}
                key={pageNo}
              >
                {tiles.map((tile) => (
                  <VideoTile
                    key={tile.peer.id}
                    peer={tile.peer}
                    width={tile.width}
                    height={tile.height}
                  />
                ))}
              </StyledVideoList.View>
            ))
          : null}
      </StyledVideoList.Container>
    </StyledVideoList.Root>
  );
};

const VideoTile: React.FC<{ peer: HMSPeer; height: number; width: number }> = ({
  peer,
  width,
  height,
}) => {
  return (
    <StyledVideoTile.Root css={{ width, height }}>
      <StyledVideoTile.Container>
        <Video trackId={peer.videoTrack} />
        <StyledVideoTile.Info>{peer.name}</StyledVideoTile.Info>
      </StyledVideoTile.Container>
    </StyledVideoTile.Root>
  );
};

export const VideoList = Template.bind({});
