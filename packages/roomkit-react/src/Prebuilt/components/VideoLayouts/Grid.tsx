import React from 'react';
import { TrackWithPeerAndDimensions } from '@100mslive/react-sdk';
import { Box } from '../../../Layout';
// @ts-ignore: No implicit Any
import VideoTile from '../VideoTile';

export const Grid = React.forwardRef<HTMLDivElement, { tiles: TrackWithPeerAndDimensions[] }>(({ tiles }, ref) => {
  return (
    <Box
      ref={ref}
      css={{
        flex: '1 1 0',
        gap: '$4',
        py: '$4',
        display: 'flex',
        placeContent: 'center',
        alignItems: 'center',
        justifyContent: 'center',
        flexFlow: 'row wrap',
        minHeight: 0,
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
          />
        );
      })}
    </Box>
  );
});
