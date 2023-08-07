import { useMeasure } from 'react-use';
import { getPeersWithTiles, selectPeers, selectTracksMap, useHMSStore } from '@100mslive/react-sdk';
import VideoTile from './VideoTile';
import { useUISettings } from './AppData/useUISettings';
import { UI_SETTINGS } from '../common/constants';

const aspectRatios = [1 / 1, 4 / 3, 16 / 9];

export function EqualProminence() {
  const peers = useHMSStore(selectPeers);
  const tracksMap = useHMSStore(selectTracksMap);
  const peersWithTiles = getPeersWithTiles(peers, tracksMap, () => false);
  const maxTileCount = useUISettings(UI_SETTINGS.maxTileCount);

  const [ref, { width, height }] = useMeasure();

  if (width > 0 && height > 0) {
    const maxPerPage = Math.min(peersWithTiles.length, maxTileCount);
    const pages = Math.ceil(peersWithTiles.length / maxPerPage);
    for (let i = 0; i < pages; i++) {
      let maxCols = Math.ceil(Math.sqrt(maxPerPage));
      let maxRows = Math.ceil(maxPerPage / maxCols);
      const matrix = new Array(maxRows).fill(null).map((_, i) => {
        const numCols = Math.min(maxCols, maxPerPage - i * maxCols);
        let rowElements = [];

        for (let j = 0; j < numCols; j++) {
          rowElements.push(peersWithTiles[i * maxCols + j]);
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
  }

  console.log(peersWithTiles);

  return (
    <div
      ref={ref}
      style={{
        width: '100%',
        height: '100%',
        padding: 8,
        gap: 8,
        display: 'flex',
        placeContent: 'center',
        alignItems: 'center',
        justifyContent: 'center',
        flexFlow: 'row wrap',
      }}
    >
      {peersWithTiles.map(tile => {
        return (
          <VideoTile
            width={tile.width}
            height={tile.height}
            peerId={tile.peer?.id}
            trackId={tile.track?.id}
            rootCSS={{ padding: 0 }}
          />
        );
      })}
    </div>
  );
}
