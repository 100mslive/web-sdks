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
import { useSetAppDataByKey } from '../AppData/useUISettings';
// @ts-ignore: No implicit Any
import { APP_DATA } from '../../common/constants';

export const ScreenshareLayout = ({ peers, onPageChange, onPageSize }: LayoutProps) => {
  const peersSharing = useHMSStore(selectPeersScreenSharing);
  const [, setActiveScreenSharePeer] = useSetAppDataByKey(APP_DATA.activeScreensharePeerId);
  const [page, setPage] = useState(0);
  const activeSharePeer = peersSharing[page];
  const isMobile = useMedia(cssConfig.media.md);
  const secondaryPeers = useMemo(
    () =>
      isMobile
        ? [activeSharePeer, ...peers.filter(p => p.id !== activeSharePeer?.id)]
        : peers.filter(p => p.id !== activeSharePeer?.id),
    [activeSharePeer, peers, isMobile],
  );
  useEffect(() => {
    setActiveScreenSharePeer(isMobile ? '' : activeSharePeer?.id);
    return () => {
      setActiveScreenSharePeer('');
    };
  }, [activeSharePeer?.id, isMobile, setActiveScreenSharePeer]);

  return (
    <ProminenceLayout.Root>
      <ProminenceLayout.ProminentSection>
        <ScreenshareTile peerId={peersSharing[page].id} />
        <Pagination page={page} onPageChange={setPage} numPages={peersSharing.length} />
      </ProminenceLayout.ProminentSection>
      <SecondaryTiles peers={secondaryPeers} onPageChange={onPageChange} onPageSize={onPageSize} />
    </ProminenceLayout.Root>
  );
};
