import { forwardRef } from 'react';
import { TrackWithPeerAndDimensions } from '@100mslive/react-sdk';
import { Box } from '../../../Layout';
// @ts-ignore: No implicit Any
import VideoTile from '../VideoTile';
import { useVideoTileContext } from '../hooks/useVideoTileLayout';

export const Grid = forwardRef<HTMLDivElement, { tiles: TrackWithPeerAndDimensions[]; edgeToEdge?: boolean }>(
  ({ tiles, edgeToEdge }, ref) => {
    const videoTileProps = useVideoTileContext();
    return (
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
          '@lg': { gap: edgeToEdge ? 0 : '$4' },
        }}
      >
        {tiles?.map(tile => {
          return (
            <VideoTile
              key={tile.track?.id || tile.peer?.id}
              width={tile.width}
              height={tile.height}
              peerId={tile.peer?.id}
              trackId={tile.track?.id}
              rootCSS={{ padding: 0 }}
              objectFit="contain"
              {...videoTileProps}
            />
          );
        })}
      </Box>
    );
  },
);
