import React, { useState } from 'react';
import { MicOffIcon } from '@100mslive/react-icons';
import { selectPeers, useHMSStore, useVideoList } from '@100mslive/react-sdk';
import { StyledVideoList } from './StyledVideoList';
import { StyledVideoTile } from '../VideoTile';
import Video from '../Video/Video';
import { getLeft } from './videoListUtils';

const VideoListMeta = {
  title: 'Video/VideoList',
};

export default VideoListMeta;

const VideoTile = ({ width, height, trackId, name }) => {
  return (
    <StyledVideoTile.Root css={{ width, height }}>
      <StyledVideoTile.Container>
        <Video trackId={trackId} />
        <StyledVideoTile.Info>{name}</StyledVideoTile.Info>
        <StyledVideoTile.AudioIndicator>
          <MicOffIcon />
        </StyledVideoTile.AudioIndicator>
      </StyledVideoTile.Container>
    </StyledVideoTile.Root>
  );
};

interface VideoListProps {
  maxTileCount: number;
  aspectRatio: {
    width: number;
    height: number;
  };
}

const VideoListStory: React.FC<VideoListProps> = ({ maxTileCount, aspectRatio }) => {
  const peers = useHMSStore(selectPeers);
  const [page] = useState(0);
  const { ref, pagesWithTiles } = useVideoList({
    peers,
    offsetY: 50,
    maxTileCount,
    aspectRatio,
  });
  return (
    <StyledVideoList.Root css={{ height: '100vh', width: '100%', bg: 'red' }} ref={ref}>
      <StyledVideoList.Container>
        {pagesWithTiles && pagesWithTiles.length > 0
          ? pagesWithTiles.map((tiles, pageNo) => (
              <StyledVideoList.View
                css={{
                  left: getLeft(pageNo, page),
                  transition: 'left 0.3s ease-in-out',
                }}
              >
                {tiles.map((tile, i) =>
                  tile.track?.source === 'screen' ? null : (
                    <VideoTile
                      key={tile.track?.id || tile.peer.id + i}
                      width={tile.width}
                      height={tile.height}
                      trackId={tile.track?.id}
                      name={tile.peer.name}
                    />
                  ),
                )}
              </StyledVideoList.View>
            ))
          : null}
      </StyledVideoList.Container>
    </StyledVideoList.Root>
  );
};

export const Example = VideoListStory.bind({});

Example.args = {
  maxTileCount: 2,
  aspectRatio: {
    width: 2,
    height: 1,
  },
};
