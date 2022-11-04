import React, { useCallback, useEffect, useState } from 'react';
import { ComponentStory } from '@storybook/react';
import { selectPeers, useHMSStore, useVideoList } from '@100mslive/react-sdk';
import { ChevronLeftIcon, ChevronRightIcon, MicOffIcon } from '@100mslive/react-icons';
import { StyledVideoList } from './StyledVideoList';
import mdx from './useVideoList.mdx';
import { getLeft } from './videoListUtils';
import { StyledPagination } from '../Pagination';
import { StoryHMSProviderWrapper } from '../common/HMSProviderWrapper';
import Video from '../Video/Video';
import { StyledVideoTile } from '../VideoTile';

type PaginationProps = {
  page: number;
  setPage: (page: number) => void;
  numPages: number;
};

const Pagination = ({ page: propsPage, setPage: propsSetPage, numPages }: PaginationProps) => {
  const [page, setPage] = useState(propsPage);

  const disableLeft = page === 0;
  const disableRight = page === numPages - 1;

  const handlePageChange = useCallback(
    (page: number) => {
      setPage(page);
      propsSetPage(page);
    },
    [setPage, propsSetPage],
  );

  const nextPage = () => {
    handlePageChange(Math.min(page + 1, numPages - 1));
  };

  const prevPage = () => {
    handlePageChange(Math.max(page - 1, 0));
  };

  useEffect(() => {
    handlePageChange(propsPage);
  }, [handlePageChange, propsPage]);

  return (
    <StyledPagination.Root>
      <StyledPagination.Chevron disabled={disableLeft} onClick={prevPage} type="button">
        <ChevronLeftIcon width={16} height={16} style={{ cursor: disableLeft ? 'not-allowed' : 'pointer' }} />
      </StyledPagination.Chevron>
      <StyledPagination.Dots>
        {[...Array(numPages)].map((_, i) => (
          <StyledPagination.Dot key={i} active={page === i} onClick={() => handlePageChange(i)} type="button" />
        ))}
      </StyledPagination.Dots>
      <StyledPagination.Chevron disabled={disableRight} onClick={nextPage} type="button">
        <ChevronRightIcon width={16} height={16} style={{ cursor: disableRight ? 'not-allowed' : 'pointer' }} />
      </StyledPagination.Chevron>
    </StyledPagination.Root>
  );
};

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
    <StyledVideoList.Root css={{ height: '100vh', width: '800px', maxHeight: '700px', marginInline: 'auto' }} ref={ref}>
      <StyledVideoList.Container>
        {pagesWithTiles && pagesWithTiles.length > 0
          ? pagesWithTiles.map((tiles, pageNo) => (
              <StyledVideoList.View
                key={pageNo}
                css={{
                  left: getLeft(pageNo, page),
                  transition: 'left 0.3s ease-in-out',
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

const Template: ComponentStory<typeof VideoListStory> = args => {
 return (
  <StoryHMSProviderWrapper>
    <VideoListStory {...args} />
  </StoryHMSProviderWrapper>
 );
}


export const Example = Template.bind({});
Example.storyName = 'useVideoList';

Example.args = {
  maxTileCount: 2,
  aspectRatio: {
    width: 2,
    height: 1,
  },
};
