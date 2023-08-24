import React, { Fragment, useEffect, useState } from 'react';
import { useVideoList } from '@100mslive/react-sdk';
import { useTheme } from '../../Theme';
import { StyledVideoList } from '../../VideoList';
import { Pagination } from './Pagination';
import ScreenshareTile from './ScreenshareTile';
import VideoTile from './VideoTile';
import { useAppConfig } from './AppData/useAppConfig';
import { useIsHeadless } from './AppData/useUISettings';

const List = ({ maxTileCount, peers, maxColCount, maxRowCount, includeScreenShareForPeer }) => {
  const { aspectRatio } = useTheme();
  const tileOffset = useAppConfig('headlessConfig', 'tileOffset');
  const isHeadless = useIsHeadless();

  const { ref, pagesWithTiles } = useVideoList({
    peers,
    maxTileCount,
    maxColCount,
    maxRowCount,
    includeScreenShareForPeer,
    aspectRatio,
    offsetY: getOffset({ isHeadless, tileOffset }),
  });
  const [page, setPage] = useState(0);
  useEffect(() => {
    // currentPageIndex should not exceed pages length
    if (page >= pagesWithTiles.length) {
      setPage(0);
    }
  }, [pagesWithTiles.length, page]);
  return (
    <StyledVideoList.Root ref={ref}>
      <StyledVideoList.Container css={{ flexWrap: 'wrap', placeContent: 'center' }}>
        {pagesWithTiles && pagesWithTiles.length > 0
          ? pagesWithTiles[page]?.map(tile => {
              if (tile.width === 0 || tile.height === 0) {
                return null;
              }
              return (
                <Fragment key={tile.track?.id || tile.peer.id}>
                  {tile.track?.source === 'screen' ? (
                    <ScreenshareTile width={tile.width} height={tile.height} peerId={tile.peer.id} />
                  ) : (
                    <VideoTile
                      width={tile.width}
                      height={tile.height}
                      peerId={tile.peer?.id}
                      trackId={tile.track?.id}
                    />
                  )}
                </Fragment>
              );
            })
          : null}
      </StyledVideoList.Container>
      {!isHeadless && pagesWithTiles.length > 1 ? (
        <Pagination page={page} onPageChange={setPage} numPages={pagesWithTiles.length} />
      ) : null}
    </StyledVideoList.Root>
  );
};

const VideoList = React.memo(List);

const getOffset = ({ tileOffset, isHeadless }) => {
  if (!isHeadless || isNaN(Number(tileOffset))) {
    return 32;
  }
  return Number(tileOffset);
};

export default VideoList;
