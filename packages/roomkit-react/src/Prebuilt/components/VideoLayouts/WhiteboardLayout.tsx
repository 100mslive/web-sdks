import React, { useEffect, useMemo } from 'react';
import { useMedia } from 'react-use';
import { selectPeerByCondition, selectWhiteboard, useHMSStore, useWhiteboard } from '@100mslive/react-sdk';
import { Box } from '../../../Layout';
import { config as cssConfig } from '../../../Theme';
import { InsetTile } from '../InsetTile';
import { SecondaryTiles } from '../SecondaryTiles';
import { LayoutMode } from '../Settings/LayoutSettings';
import { LayoutProps } from './interface';
import { ProminenceLayout } from './ProminenceLayout';
// @ts-ignore: No implicit Any
import { useSetUiSettings } from '../AppData/useUISettings';
import { UI_SETTINGS } from '../../common/constants';

const WhiteboardEmbed = () => {
  const isMobile = useMedia(cssConfig.media.md);
  const { token } = useWhiteboard(isMobile);

  if (!token) {
    return null;
  }

  return (
    <Box
      css={{
        mx: '$8',
        flex: '3 1 0',
        '@lg': {
          flex: '2 1 0',
          display: 'flex',
          alignItems: 'center',
        },
      }}
    >
      <Box css={{ size: '100%' }} />
    </Box>
  );
};

export const WhiteboardLayout = ({ peers, onPageChange, onPageSize, edgeToEdge }: LayoutProps) => {
  const whiteboard = useHMSStore(selectWhiteboard);
  const whiteboardOwner = useHMSStore(selectPeerByCondition(peer => peer.customerUserId === whiteboard?.owner));
  const [layoutMode, setLayoutMode] = useSetUiSettings(UI_SETTINGS.layoutMode);
  const isMobile = useMedia(cssConfig.media.md);
  const hasSidebar = !isMobile && layoutMode === LayoutMode.SIDEBAR;
  const secondaryPeers = useMemo(() => {
    if (layoutMode === LayoutMode.SPOTLIGHT) {
      return [];
    }
    if (isMobile || layoutMode === LayoutMode.SIDEBAR) {
      return whiteboardOwner
        ? [whiteboardOwner, ...peers.filter(p => p.id !== whiteboardOwner?.id)] //keep active sharing peer as first tile
        : peers;
    }
    return peers.filter(p => p.id !== whiteboardOwner?.id);
  }, [whiteboardOwner, peers, isMobile, layoutMode]);

  useEffect(() => {
    if (isMobile) {
      setLayoutMode(LayoutMode.GALLERY);
      return;
    }
    if (layoutMode === LayoutMode.SIDEBAR) {
      return;
    }
    setLayoutMode(LayoutMode.SIDEBAR);
    return () => {
      // reset to gallery once whiteboard is stopped
      setLayoutMode(LayoutMode.GALLERY);
    };
  }, [isMobile]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <ProminenceLayout.Root edgeToEdge={edgeToEdge} hasSidebar={hasSidebar}>
      <ProminenceLayout.ProminentSection>
        <WhiteboardEmbed />
      </ProminenceLayout.ProminentSection>
      <SecondaryTiles
        peers={secondaryPeers}
        onPageChange={onPageChange}
        onPageSize={onPageSize}
        edgeToEdge={edgeToEdge}
        hasSidebar={hasSidebar}
      />
      {layoutMode === LayoutMode.SPOTLIGHT && whiteboardOwner && <InsetTile peerId={whiteboardOwner?.id} />}
    </ProminenceLayout.Root>
  );
};
