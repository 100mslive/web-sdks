import { useEffect, useState } from 'react';
import { useMeasure } from 'react-use';
import { getPeersWithTiles, selectPeers, selectTracksMap, useHMSStore, useHMSVanillaStore } from '@100mslive/react-sdk';
import { Flex } from '../../Layout';
import { Pagination } from './Pagination';
import VideoTile from './VideoTile';
import { useUISettings } from './AppData/useUISettings';
import { UI_SETTINGS } from '../common/constants';

const aspectRatios = [1 / 1, 4 / 3, 16 / 9];

export function EqualProminence() {
  const peers = useHMSStore(selectPeers);
  const vanillaStore = useHMSVanillaStore();
  const maxTileCount = useUISettings(UI_SETTINGS.maxTileCount);
  const [pagesWithTiles, setPagesWithTiles] = useState([]);
  const [page, setPage] = useState(0);
  const [ref, { width, height }] = useMeasure();

  useEffect(() => {
    // currentPageIndex should not exceed pages length
    if (page >= pagesWithTiles.length) {
      setPage(0);
    }
  }, [pagesWithTiles.length, page]);

  useEffect(() => {
    if (width === 0 || height === 0) {
      return;
    }
    const tracksMap = vanillaStore.getState(selectTracksMap);
    const peersWithTiles = getPeersWithTiles(peers, tracksMap, () => false);
    const maxPerPage = Math.min(peersWithTiles.length, maxTileCount);
    const pages = Math.ceil(peersWithTiles.length / maxPerPage);
    let pagesList = [];
    let index = 0;
    for (let pageNo = 0; pageNo < pages; pageNo++) {
      let maxCols = Math.ceil(Math.sqrt(maxPerPage));
      let maxRows = Math.ceil(maxPerPage / maxCols);
      // eslint-disable-next-line no-loop-func
      const matrix = new Array(maxRows).fill(null).map((_, i) => {
        const numCols = Math.min(maxCols, maxPerPage - i * maxCols);
        let rowElements = [];

        for (let j = 0; j < numCols; j++) {
          if (index < peersWithTiles.length) {
            rowElements.push(peersWithTiles[index++]);
          }
        }

        return rowElements;
      });

      const maxHeight = height - (maxRows - 1) * 8;
      const maxRowHeight = maxHeight / matrix.length;
      const pageList = [];
      for (const row of matrix) {
        let tileWidth = (width - (row.length - 1) * 8) / row.length;
        let tileHeight = 0;
        const calcHeights = aspectRatios.map(aR => tileWidth / aR);
        for (const h of calcHeights) {
          if (h < maxRowHeight) {
            if (tileHeight < h) {
              tileHeight = h;
            }
          }
        }
        if (tileHeight === 0) {
          tileHeight = maxRowHeight;
          const calcWidths = aspectRatios.map(aR => tileHeight * aR);
          tileWidth = 0;
          for (const w of calcWidths) {
            if (w < width) {
              if (tileWidth < w) {
                tileWidth = w;
              }
            }
          }
        }
        for (let i = 0; i < row.length; i++) {
          row[i].width = tileWidth;
          row[i].height = tileHeight;
          pageList.push(row[i]);
        }
      }
      pagesList.push(pageList);
    }
    setPagesWithTiles(pagesList);
  }, [width, height, maxTileCount, vanillaStore, peers, page]);

  return (
    <Flex direction="column" css={{ size: '100%' }}>
      <div
        ref={ref}
        style={{
          flex: '1 1 0',
          padding: 8,
          gap: 8,
          display: 'flex',
          placeContent: 'center',
          alignItems: 'center',
          justifyContent: 'center',
          flexFlow: 'row wrap',
          minHeight: 0,
        }}
      >
        {pagesWithTiles[page]?.map(tile => {
          return (
            <VideoTile
              key={tile.track?.id || tile.peer?.id}
              width={tile.width}
              height={tile.height}
              peerId={tile.peer?.id}
              trackId={tile.track?.id}
              rootCSS={{ padding: 0 }}
            />
          );
        })}
      </div>
      {pagesWithTiles.length > 1 && <Pagination page={page} onPageChange={setPage} numPages={pagesWithTiles.length} />}
    </Flex>
  );
}
