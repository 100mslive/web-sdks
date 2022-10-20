import React, { useState } from 'react';
import { MicOffIcon } from '@100mslive/react-icons';
import { selectPeers, useHMSStore, useVideoList } from '@100mslive/react-sdk';
import { StyledVideoList } from './StyledVideoList';
import { StyledVideoTile } from '../VideoTile';
import Video from '../Video/Video';
import { getLeft } from './videoListUtils';
import { ComponentStory } from '@storybook/react';
import { PaginationComponent as Pagination } from '../Pagination/StyledPagination.stories';
import mdx from './useVideoList.mdx';

const VideoListMeta = {
  title: 'Hooks/useVideoList',
  parameters: {
    docs: {
      page: mdx,
    },
  },
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

const VideoListStory: React.FC<VideoListProps> = ({ maxTileCount, aspectRatio }) => {
  const peers = useHMSStore(selectPeers);
  const [page, setPage] = useState(0);
  const { ref, pagesWithTiles } = useVideoList({
    peers,
    offsetY: 50,
    maxTileCount,
    aspectRatio,
  });

  return (
    <StyledVideoList.Root css={{ height: '100vh', width: '800px', maxHeight: '550px' }} ref={ref}>
      <StyledVideoList.Container>
        {pagesWithTiles && pagesWithTiles.length > 0
          ? pagesWithTiles.map((tiles, pageNo) => (
              <StyledVideoList.View
                key={pageNo}
                css={{
                  left: getLeft(pageNo, page),
                  transition: 'left 0.3s ease-in-out',
                  overflowY: 'auto',
                }}
              >
                {tiles.map((tile, i) =>
                  tile.track?.source === 'screen' ? null : (
                    <VideoTile
                      key={i}
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
      <div>
        {pagesWithTiles.length > 1 ? (
          <Pagination page={page} setPage={setPage} numPages={pagesWithTiles.length} />
        ) : null}
      </div>
    </StyledVideoList.Root>
  );
};

const Template: ComponentStory<typeof VideoListStory> = args => <VideoListStory {...args} />;

export const Example = Template.bind({});
Example.storyName = 'useVideoList';

Example.args = {
  maxTileCount: 2,
  aspectRatio: {
    width: 2,
    height: 1,
  },
};
