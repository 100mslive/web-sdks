import React from 'react';
import { TrackWithPeerAndDimensions } from '@100mslive/react-sdk';
import { Box, Flex } from '../../../Layout';
import { CSS } from '../../../Theme';
import { LayoutMode } from '../Settings/LayoutSettings';
// @ts-ignore: No implicit Any
import VideoTile from '../VideoTile';
// @ts-ignore: No implicit Any
import { useUISettings } from '../AppData/useUISettings';
import { useVideoTileContext } from '../hooks/useVideoTileLayout';
import { UI_SETTINGS } from '../../common/constants';

const Root = ({ children, edgeToEdge }: React.PropsWithChildren<{ edgeToEdge?: boolean }>) => {
  const layoutMode = useUISettings(UI_SETTINGS.layoutMode);
  return (
    <Flex
      direction={layoutMode === LayoutMode.SIDEBAR ? 'row' : 'column'}
      css={{ h: '100%', flex: '1 1 0', minWidth: 0, gap: '$6', '@md': { gap: edgeToEdge ? 0 : '$6' } }}
    >
      {children}
    </Flex>
  );
};

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
  const layoutMode = useUISettings(UI_SETTINGS.layoutMode);
  if (!tiles?.length) {
    return null;
  }
  const gridStyles =
    layoutMode === LayoutMode.SIDEBAR
      ? {
          gridTemplateColumns: '1fr',
          gridTemplateRows: `repeat(${tiles.length}, minmax(0, 135px))`,
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
        gap: '$2 $4',
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
              maxHeight: '100%',
              aspectRatio: 16 / 9,
              '@md': { aspectRatio: 1 },
            }}
            objectFit="contain"
            {...tileLayoutProps}
          />
        );
      })}
      {children && (
        <Box css={{ gridColumn: layoutMode === LayoutMode.SIDEBAR ? 1 : `1/span ${tiles.length}` }}>{children}</Box>
      )}
    </Box>
  );
};

export const ProminenceLayout = {
  Root,
  ProminentSection,
  SecondarySection,
};
