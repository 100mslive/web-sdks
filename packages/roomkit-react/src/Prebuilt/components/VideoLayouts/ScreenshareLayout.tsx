import React, { useEffect, useMemo, useState } from 'react';
import { useMedia } from 'react-use';
import { selectPeersScreenSharing, useHMSStore } from '@100mslive/react-sdk';
import { config as cssConfig } from '../../../Theme';
import { Pagination } from '../Pagination';
// @ts-ignore: No implicit Any
import ScreenshareTile from '../ScreenshareTile';
import { SecondaryTiles } from '../SecondaryTiles';
import { LayoutProps } from './interface';
import { ProminenceLayout } from './ProminenceLayout';
// @ts-ignore: No implicit Any
import { useSetAppDataByKey, useUISettings } from '../AppData/useUISettings';
import { LayoutMode } from '../Settings/common';
import { APP_DATA, UI_SETTINGS } from '../../common/constants';

export const ScreenshareLayout = ({ peers, onPageChange, onPageSize, edgeToEdge }: LayoutProps) => {
  const peersSharing = useHMSStore(selectPeersScreenSharing);
  const [, setActiveScreenSharePeer] = useSetAppDataByKey(APP_DATA.activeScreensharePeerId);
  const [page, setPage] = useState(0);
  const layoutMode = useUISettings(UI_SETTINGS.layoutMode);
  const activeSharePeer = peersSharing[page];
  const isMobile = useMedia(cssConfig.media.md);
  const secondaryPeers = useMemo(() => {
    if (isMobile || layoutMode === LayoutMode.SIDEBAR) {
      return activeSharePeer
        ? [activeSharePeer, ...peers.filter(p => p.id !== activeSharePeer?.id)] //keep active sharing peer as first tile
        : peers;
    }
    return peers.filter(p => p.id !== activeSharePeer?.id);
  }, [activeSharePeer, peers, isMobile, layoutMode]);
  useEffect(() => {
    setActiveScreenSharePeer(isMobile ? '' : activeSharePeer?.id);
    return () => {
      setActiveScreenSharePeer('');
    };
  }, [activeSharePeer?.id, isMobile, setActiveScreenSharePeer]);

  return (
    <ProminenceLayout.Root edgeToEdge={edgeToEdge}>
      <ProminenceLayout.ProminentSection>
        <ScreenshareTile peerId={peersSharing[page]?.id} />
        {!edgeToEdge && <Pagination page={page} onPageChange={setPage} numPages={peersSharing.length} />}
      </ProminenceLayout.ProminentSection>
      <SecondaryTiles
        peers={secondaryPeers}
        onPageChange={onPageChange}
        onPageSize={onPageSize}
        edgeToEdge={edgeToEdge}
      />
    </ProminenceLayout.Root>
  );
};
