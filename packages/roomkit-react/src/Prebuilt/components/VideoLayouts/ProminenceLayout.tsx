import React from 'react';
import { TrackWithPeerAndDimensions } from '@100mslive/react-sdk';
import { Flex } from '../../../Layout';
import { CSS } from '../../../Theme';
// @ts-ignore: No implicit Any
import VideoTile from '../VideoTile';

const Root = ({ children }: React.PropsWithChildren) => (
  <Flex direction="column" css={{ size: '100%' }}>
    {children}
  </Flex>
);

const ProminentSection = ({ children, css = {} }: React.PropsWithChildren<{ css?: CSS }>) => {
  return (
    <Flex direction="column" css={{ flex: '1 1 0', minHeight: 0, ...css }}>
      {children}
    </Flex>
  );
};

const SecondarySection = ({ tiles, children }: React.PropsWithChildren<{ tiles: TrackWithPeerAndDimensions[] }>) => {
  return (
    <Flex direction="column" css={{ flexBasis: tiles?.length > 0 ? 154 : 0, minHeight: 0, gap: '$2' }}>
      <Flex justify="center" align="center" css={{ gap: '$4', minHeight: 0 }}>
        {tiles?.map(tile => {
          return (
            <VideoTile
              key={tile.track?.id || tile.peer?.id}
              height="100%"
              peerId={tile.peer?.id}
              trackId={tile.track?.id}
              rootCSS={{
                padding: 0,
                flex: '1 1 0',
                maxWidth: 'max-content',
              }}
              containerCSS={{
                width: 'unset',
                aspectRatio: 16 / 9,
                '@md': { aspectRatio: 1 },
              }}
              objectFit="contain"
            />
          );
        })}
      </Flex>
      {children}
    </Flex>
  );
};

export const ProminenceLayout = {
  Root,
  ProminentSection,
  SecondarySection,
};
