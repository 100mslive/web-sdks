import React, { useEffect, useMemo, useState } from 'react';
import { useMeasure, useMedia } from 'react-use';
import {
  getPeersWithTiles,
  selectLocalPeer,
  selectPeers,
  selectRemotePeers,
  selectTracksMap,
  useHMSStore,
  useHMSVanillaStore,
} from '@100mslive/react-sdk';
import { Box, Flex } from '../../Layout';
import { config as cssConfig } from '../../Theme';
import { InsetTile } from '../layouts/InsetView';
import { useRoomLayout } from '../provider/roomLayoutProvider';
import { Pagination } from './Pagination';
import VideoTile from './VideoTile';
import { useUISettings } from './AppData/useUISettings';
import PeersSorter from '../common/PeersSorter';
import { UI_SETTINGS } from '../common/constants';

const aspectRatioConfig = { default: [1 / 1, 4 / 3, 16 / 9], mobile: [1 / 1, 3 / 4, 9 / 16] };

export function EqualProminence() {
  const layout = useRoomLayout();
  const { enable_local_tile_inset: isInsetEnabled = true } =
    //@ts-ignore
    layout?.screens?.conferencing?.default?.elements?.video_tile_layout?.grid || {};
  const peers = useHMSStore(isInsetEnabled ? selectRemotePeers : selectPeers);
  const [sortedPeers, setSortedPeers] = useState(peers);
  const localPeer = useHMSStore(selectLocalPeer);
  const vanillaStore = useHMSVanillaStore();
  const isMobile = useMedia(cssConfig.media.md);
  let maxTileCount = useUISettings(UI_SETTINGS.maxTileCount);
  maxTileCount = isMobile ? Math.min(maxTileCount, 6) : maxTileCount;
  const [pagesWithTiles, setPagesWithTiles] = useState([]);
  const [page, setPage] = useState(0);
  const [ref, { width, height }] = useMeasure();
  const peersSorter = useMemo(() => new PeersSorter(vanillaStore), [vanillaStore]);
  const pageSize = pagesWithTiles[0]?.length;

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
    const peersWithTiles = getPeersWithTiles(sortedPeers, tracksMap, () => false);
    const noOfPages = Math.ceil(peersWithTiles.length / maxTileCount);
    let remaining = peersWithTiles.length;
    let sliceStart = 0;
    let pagesList = [];
    // split into pages
    for (let i = 0; i < noOfPages; i++) {
      const count = Math.min(remaining, maxTileCount);
      pagesList.push(peersWithTiles.slice(sliceStart, sliceStart + count));
      remaining = remaining - count;
      sliceStart += count;
    }
    // calculate dimesions for each page
    for (const page of pagesList) {
      const noOfTilesInPage = page.length;
      let maxCols =
        noOfTilesInPage > 2 && noOfTilesInPage < 9
          ? Math.ceil(noOfTilesInPage / 2)
          : Math.ceil(Math.sqrt(noOfTilesInPage));
      if (isMobile) {
        maxCols = noOfTilesInPage < 4 ? 1 : Math.min(maxCols, 2);
      }
      let maxRows = Math.ceil(noOfTilesInPage / maxCols);
      let index = 0;
      // convert the current page to a matrix(grid)
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
      const aspectRatios =
        isMobile && (noOfTilesInPage === 1 || noOfTilesInPage > 3)
          ? aspectRatioConfig.mobile
          : aspectRatioConfig.default;
      // calculate height and width of each tile in a row
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
  }, [width, height, maxTileCount, vanillaStore, sortedPeers, page, isMobile, localPeer]);

  useEffect(() => {
    if (page !== 0) {
      return;
    }
    peersSorter.setPeersAndTilesPerPage({
      peers,
      tilesPerPage: pageSize || maxTileCount,
    });
    peersSorter.onUpdate(setSortedPeers);
  }, [page, peersSorter, peers, pageSize, maxTileCount]);

  return (
    <Flex direction="column" css={{ flex: '1 1 0', h: '100%', position: 'relative', minWidth: 0 }}>
      <Box
        ref={ref}
        css={{
          flex: '1 1 0',
          gap: '$4',
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
              objectFit="contain"
            />
          );
        })}
      </Box>
      {pagesWithTiles.length > 1 && <Pagination page={page} onPageChange={setPage} numPages={pagesWithTiles.length} />}
      {isInsetEnabled && pagesWithTiles.length > 0 && <InsetTile />}
    </Flex>
  );
}
