import React from 'react';
import { TrackWithPeerAndDimensions } from '@100mslive/react-sdk';
import { Box, Flex } from '../../../Layout';
import { CSS } from '../../../Theme';
// @ts-ignore: No implicit Any
import VideoTile from '../VideoTile';
import { useVideoTileContext } from '../hooks/useVideoTileLayout';

const Root = ({ children, edgeToEdge }: React.PropsWithChildren<{ edgeToEdge?: boolean }>) => (
  <Flex
    direction="column"
    css={{ h: '100%', flex: '1 1 0', minWidth: 0, gap: '$6', '@md': { gap: edgeToEdge ? 0 : '$6' } }}
  >
    {children}
  </Flex>
);

const ProminentSection = ({ children, css = {} }: React.PropsWithChildren<{ css?: CSS }>) => {
  return (
    <Flex direction="column" css={{ flex: '1 1 0', gap: '$2', minHeight: 0, ...css }}>
      {children}
    </Flex>
  );
};

const SecondarySection = ({
  tiles,
  children,
  edgeToEdge,
}: React.PropsWithChildren<{ tiles: TrackWithPeerAndDimensions[]; edgeToEdge?: boolean }>) => {
  const tileLayoutProps = useVideoTileContext();
  if (!tiles?.length) {
    return null;
  }
  return (
    <Box
      css={{
        display: 'grid',
        gridTemplateRows: React.Children.count(children) > 0 ? '136px auto' : '154px',
        gridTemplateColumns: `repeat(${tiles.length}, minmax(20%, max-content))`,
        margin: '0 auto',
        gap: '$2 $4',
        placeItems: 'center',
        '@md': { gap: edgeToEdge ? 0 : '$4' },
      }}
    >
      {tiles.map(tile => {
        return (
          <VideoTile
            key={tile.track?.id || tile.peer?.id}
            peerId={tile.peer?.id}
            trackId={tile.track?.id}
            rootCSS={{
              padding: 0,
              maxWidth: 240,
              aspectRatio: 16 / 9,
              '@md': { aspectRatio: 1 },
            }}
            objectFit="contain"
            {...tileLayoutProps}
          />
        );
      })}
      <Box css={{ gridColumn: `1/span ${tiles.length}` }}>{children}</Box>
    </Box>
  );
};

export const ProminenceLayout = {
  Root,
  ProminentSection,
  SecondarySection,
};
