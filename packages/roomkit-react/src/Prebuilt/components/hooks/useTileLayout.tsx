import { useEffect, useMemo, useState } from 'react';
import { useMeasure, useMedia } from 'react-use';
import {
  getPeersWithTiles,
  HMSPeer,
  selectTracksMap,
  TrackWithPeerAndDimesions,
  useHMSVanillaStore,
} from '@100mslive/react-sdk';
import { config as cssConfig } from '../../../Theme';

const aspectRatioConfig = { default: [1 / 1, 4 / 3, 16 / 9], mobile: [1 / 1, 3 / 4, 9 / 16] };

export const usePagesWithTiles = ({ peers, maxTileCount }: { peers: HMSPeer[]; maxTileCount: number }) => {
  const vanillaStore = useHMSVanillaStore();
  const tracksMap = vanillaStore.getState(selectTracksMap);
  const peersWithTiles = useMemo(
    () => getPeersWithTiles(peers, tracksMap, () => false) as TrackWithPeerAndDimesions[],
    [peers, tracksMap],
  );
  const noOfPages = Math.ceil(peersWithTiles.length / maxTileCount);
  const pagesList = useMemo(() => {
    let sliceStart = 0;
    let remaining = peersWithTiles.length;
    const list = [];
    // split into pages
    for (let i = 0; i < noOfPages; i++) {
      const count = Math.min(remaining, maxTileCount);
      list.push(peersWithTiles.slice(sliceStart, sliceStart + count));
      remaining = remaining - count;
      sliceStart += count;
    }
    return list;
  }, [peersWithTiles, noOfPages, maxTileCount]);
  return pagesList;
};

export const useTileLayout = ({ peers, maxTileCount }: { peers: HMSPeer[]; maxTileCount: number }) => {
  const vanillaStore = useHMSVanillaStore();
  const [ref, { width, height }] = useMeasure();
  const isMobile = useMedia(cssConfig.media.md);
  const [pagesWithTiles, setPagesWithTiles] = useState<TrackWithPeerAndDimesions[][]>([]);
  const pagesList = usePagesWithTiles({ peers, maxTileCount });

  useEffect(() => {
    if (width === 0 || height === 0) {
      return;
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
      const maxRows = Math.ceil(noOfTilesInPage / maxCols);
      let index = 0;
      // convert the current page to a matrix(grid)
      const matrix = new Array(maxRows).fill(null).map((_, i) => {
        const numCols = Math.min(maxCols, noOfTilesInPage - i * maxCols);
        const rowElements = [];
        for (let j = 0; j < numCols; j++) {
          if (index < page.length) {
            rowElements.push(page[index++]);
          }
        }
        return rowElements;
      });

      const maxHeight = height - (maxRows - 1) * 8;
      const maxRowHeight = maxHeight / matrix.length;
      const aspectRatios = isMobile && noOfTilesInPage > 3 ? aspectRatioConfig.mobile : aspectRatioConfig.default;
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
  }, [width, height, maxTileCount, pagesList, vanillaStore, isMobile]);
  return { pagesWithTiles, ref };
};
