import React from 'react';
import { useMedia } from 'react-use';
import { TrackWithPeerAndDimensions } from '@100mslive/react-sdk';
import { Flex } from '../../../Layout';
import { config as cssConfig } from '../../../Theme';
// @ts-ignore: No implicit Any
import VideoTile from '../VideoTile';

const Root = ({ children }: React.PropsWithChildren) => (
  <Flex direction="column" css={{ size: '100%' }}>
    {children}
  </Flex>
);

const ProminentSection = ({ children }: React.PropsWithChildren) => {
  return (
    <Flex direction="column" css={{ flex: '1 1 0' }}>
      {children}
    </Flex>
  );
};

const SecondarySection = ({ tiles, children }: React.PropsWithChildren<{ tiles: TrackWithPeerAndDimensions[] }>) => {
  const isMobile = useMedia(cssConfig.media.md);

  return (
    <Flex direction="column" css={{ flexShrink: 0 }}>
      <Flex justify="center" align="center" css={{ gap: '$4' }}>
        {tiles?.map(tile => {
          return (
            <VideoTile
              key={tile.track?.id || tile.peer?.id}
              width={tile.width}
              height="100%"
              peerId={tile.peer?.id}
              trackId={tile.track?.id}
              rootCSS={{ padding: 0, aspectRatio: isMobile ? 1 : 16 / 9 }}
              objectFit="contain"
            />
          );
        })}
      </Flex>
      {children}
    </Flex>
  );
};

export const RoleProminenceLayout = {
  Root,
  ProminentSection,
  SecondarySection,
};
