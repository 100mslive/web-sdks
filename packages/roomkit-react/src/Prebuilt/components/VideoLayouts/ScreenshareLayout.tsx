import React, { useEffect, useMemo, useState } from 'react';
import { selectPeersScreenSharing, useHMSStore } from '@100mslive/react-sdk';
import { config as cssConfig } from '../../../Theme';
import { InsetTile } from '../InsetTile';
import { Pagination } from '../Pagination';
// @ts-ignore: No implicit Any
import ScreenshareTile from '../ScreenshareTile';
import { SecondaryTiles } from '../SecondaryTiles';
import { LayoutMode } from '../Settings/LayoutSettings';
import { LayoutProps } from './interface';
import { ProminenceLayout } from './ProminenceLayout';
import { useMedia } from '../../common/useMediaOverride';
// @ts-ignore: No implicit Any
import { useSetAppDataByKey, useSetUiSettings } from '../AppData/useUISettings';
import { APP_DATA, UI_SETTINGS } from '../../common/constants';

export const ScreenshareLayout = ({ peers, onPageChange, onPageSize, edgeToEdge }: LayoutProps) => {
  const peersSharing = useHMSStore(selectPeersScreenSharing);
  const [, setActiveScreenSharePeer] = useSetAppDataByKey(APP_DATA.activeScreensharePeerId);
  const [page, setPage] = useState(0);
  const [layoutMode, setLayoutMode] = useSetUiSettings(UI_SETTINGS.layoutMode);
  const activeSharePeer = peersSharing[page];
  const isMobile = useMedia(cssConfig.media.md);
  const hasSidebar = !isMobile && layoutMode === LayoutMode.SIDEBAR;
  const secondaryPeers = useMemo(() => {
    if (layoutMode === LayoutMode.SPOTLIGHT) {
      return [];
    }
    if (isMobile || layoutMode === LayoutMode.SIDEBAR) {
      return activeSharePeer
        ? [activeSharePeer, ...peers.filter(p => p.id !== activeSharePeer?.id)] //keep active sharing peer as first tile
        : peers;
    }
    return peers.filter(p => p.id !== activeSharePeer?.id);
  }, [activeSharePeer, peers, isMobile, layoutMode]);

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
      // reset to gallery once screenshare is stopped
      setLayoutMode(LayoutMode.GALLERY);
    };
  }, [isMobile]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    setActiveScreenSharePeer(activeSharePeer?.id);
    return () => {
      setActiveScreenSharePeer('');
    };
  }, [activeSharePeer?.id, setActiveScreenSharePeer]);

  return (
    <ProminenceLayout.Root edgeToEdge={edgeToEdge} hasSidebar={hasSidebar}>
      <ProminenceLayout.ProminentSection>
        <ScreenshareTile peerId={peersSharing[page]?.id} />
        {!edgeToEdge && <Pagination page={page} onPageChange={setPage} numPages={peersSharing.length} />}
      </ProminenceLayout.ProminentSection>
      <SecondaryTiles
        peers={secondaryPeers}
        onPageChange={onPageChange}
        onPageSize={onPageSize}
        edgeToEdge={edgeToEdge}
        hasSidebar={hasSidebar}
      />
      {layoutMode === LayoutMode.SPOTLIGHT && activeSharePeer && <InsetTile peerId={activeSharePeer?.id} />}
    </ProminenceLayout.Root>
  );
};
