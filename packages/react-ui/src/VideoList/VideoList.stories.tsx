import React, { useState } from 'react';
import { ComponentStory } from '@storybook/react';
import { selectPeers, useHMSStore, useVideoList } from '@100mslive/react-sdk';
import { MicOffIcon } from '@100mslive/react-icons';
import { StyledVideoList } from './StyledVideoList';
import { getLeft } from './videoListUtils';
import Video from '../Video/Video';
import { StyledVideoTile } from '../VideoTile';

const VideoListMeta = {
  title: 'Video/VideoList',
};

export default VideoListMeta;

const VideoTile: React.FC<{ width: number; height: number; trackId: string; name: string }> = ({
  width,
  height,
  trackId,
  name,
}) => {
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

export const VideoListStory: React.FC<VideoListProps> = ({ maxTileCount, aspectRatio }) => {
  const peers = useHMSStore(selectPeers);
  const [page] = useState(0);
  const { ref, pagesWithTiles } = useVideoList({
    peers,
    offsetY: 50,
    maxTileCount,
    aspectRatio,
  });
  console.error({ peers });
  return (
    <StyledVideoList.Root css={{ height: '100vh', width: '100%' }} ref={ref}>
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
                {tiles.map((tile) =>
                  tile.track?.source === 'screen' ? null : (
                    <VideoTile
                      key={tile.peer.id}
                      width={tile.width}
                      height={tile.height}
                      trackId={tile.track?.id || ''}
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

const Template: ComponentStory<typeof VideoListStory> = args => <VideoListStory {...args} />;

export const Example = Template.bind({});

Example.args = {
  maxTileCount: 2,
  aspectRatio: {
    width: 2,
    height: 1,
  },
};
