import { useEffect, useState } from 'react';
import { useMeasure } from 'react-use';
import { getPeersWithTiles, selectPeers, selectTracksMap, useHMSStore, useHMSVanillaStore } from '@100mslive/react-sdk';
import { Flex } from '../../Layout';
import { InsetTile } from '../layouts/InsetView';
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
    const noOfPages = Math.ceil(peersWithTiles.length / maxTileCount);
    let remaining = peersWithTiles.length;
    let sliceStart = 0;
    let pagesList = [];
    for (let i = 0; i < noOfPages; i++) {
      const count = Math.min(remaining, maxTileCount);
      pagesList.push(peersWithTiles.slice(sliceStart, sliceStart + count));
      remaining = remaining - count;
      sliceStart += count;
    }
    for (const page of pagesList) {
      const noOfTilesInPage = page.length;
      let maxCols =
        noOfTilesInPage > 2 && noOfTilesInPage < 9
          ? Math.ceil(noOfTilesInPage / 2)
          : Math.ceil(Math.sqrt(noOfTilesInPage));
      let maxRows = Math.ceil(noOfTilesInPage / maxCols);
      let index = 0;
      const matrix = new Array(maxRows).fill(null).map((_, i) => {
        const numCols = Math.min(maxCols, noOfTilesInPage - i * maxCols);
        let rowElements = [];
        for (let j = 0; j < numCols; j++) {
          if (index < page.length) {
            rowElements.push(page[index++]);
          }
        }
        return rowElements;
      });

      const maxHeight = height - (maxRows - 1) * 8;
      const maxRowHeight = maxHeight / matrix.length;
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

        // tileHeight is not calculated as it could be exceeding the max possible height
        // find the max possible width instead
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
        }
      }
    }
    setPagesWithTiles(pagesList);
  }, [width, height, maxTileCount, vanillaStore, peers, page]);

  return (
    <Flex direction="column" css={{ size: '100%', position: 'relative' }}>
      <div
        ref={ref}
        style={{
          flex: '1 1 0',
          padding: '$4',
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
      <InsetTile />
    </Flex>
  );
}
