import React from 'react';
import { TrackWithPeerAndDimensions } from '@100mslive/react-sdk';
import { Box, Flex } from '../../../Layout';
// @ts-ignore: No implicit Any
import VideoTile from '../VideoTile';
import { useVideoTileContext } from '../hooks/useVideoTileLayout';

const Root = ({
  children,
  edgeToEdge,
  hasSidebar,
}: React.PropsWithChildren<{ edgeToEdge?: boolean; hasSidebar?: boolean }>) => {
  return (
    <Flex
      direction={hasSidebar ? 'row' : 'column'}
      css={{ h: '100%', flex: '1 1 0', minWidth: 0, gap: '6', '@md': { gap: edgeToEdge ? 0 : '$6' } }}
    >
      {children}
    </Flex>
  );
};

const ProminentSection = ({ children, css = {} }: React.PropsWithChildren<{ css?: Record<string, any> }>) => {
  return (
    <Flex direction="column" css={{ flex: '1 1 0', gap: '2', minHeight: 0, ...css }}>
      {children}
    </Flex>
  );
};

const SecondarySection = ({
  tiles,
  children,
  edgeToEdge,
  hasSidebar,
}: React.PropsWithChildren<{ tiles: TrackWithPeerAndDimensions[]; edgeToEdge?: boolean; hasSidebar?: boolean }>) => {
  const tileLayoutProps = useVideoTileContext();
  if (!tiles?.length) {
    return null;
  }
  const gridStyles = hasSidebar
    ? {
        gridTemplateColumns: '1fr',
        gridTemplateRows: `repeat(${tiles.length}, minmax(0, 1fr))`,
        maxHeight: '100%',
        width: 240,
      }
    : {
        gridTemplateRows: React.Children.count(children) > 0 ? '136px auto' : '154px',
        gridTemplateColumns: `repeat(${tiles.length}, minmax(0, 1fr))`,
      };
  return (
    <Box
      css={{
        display: 'grid',
        margin: 'auto',
        gap: hasSidebar ? '$8' : '$2 $4',
        placeItems: 'center',
        ...gridStyles,
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
              aspectRatio: '16 / 9',
              ...(hasSidebar ? { w: '100%' } : { h: '100%' }),
              '@md': { aspectRatio: '1' },
            }}
            objectFit="contain"
            {...tileLayoutProps}
          />
        );
      })}
      {children && <Box css={{ gridColumn: hasSidebar ? 1 : `1/span ${tiles.length}` }}>{children}</Box>}
    </Box>
  );
};

export const ProminenceLayout = {
  Root,
  ProminentSection,
  SecondarySection,
};
