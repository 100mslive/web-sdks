import React, { useEffect, useMemo, useState } from 'react';
import { selectPeersScreenSharing, useHMSStore } from '@100mslive/react-sdk';
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
  const activeSharePeerId = peersSharing[page]?.id;
  const secondaryPeers = useMemo(() => peers.filter(p => p.id !== activeSharePeerId), [activeSharePeerId, peers]);
  useEffect(() => {
    setActiveScreenSharePeer(activeSharePeerId);
    return () => {
      setActiveScreenSharePeer('');
    };
  }, [activeSharePeerId, setActiveScreenSharePeer]);

  return (
    <ProminenceLayout.Root>
      <ProminenceLayout.ProminentSection css={{ pr: '$8', pb: '$8' }}>
        <ScreenshareTile peerId={peersSharing[page].id} />
        <Pagination page={page} onPageChange={setPage} numPages={peersSharing.length} />
      </ProminenceLayout.ProminentSection>
      <SecondaryTiles peers={secondaryPeers} onPageChange={onPageChange} onPageSize={onPageSize} />
    </ProminenceLayout.Root>
  );
};
