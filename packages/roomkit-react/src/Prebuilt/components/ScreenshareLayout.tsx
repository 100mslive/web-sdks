import React, { useEffect, useMemo, useState } from 'react';
import { selectPeers, selectPeersScreenSharing, useHMSStore } from '@100mslive/react-sdk';
import { RoleProminenceLayout } from './VideoLayouts/RoleProminenceLayout';
import { Pagination } from './Pagination';
// @ts-ignore: No implicit Any
import ScreenshareTile from './ScreenshareTile';
import { SecondaryTiles } from './SecondaryTiles';
// @ts-ignore: No implicit Any
import { useSetAppDataByKey } from './AppData/useUISettings';
// @ts-ignore: No implicit Any
import { APP_DATA } from '../common/constants';

export const ScreenshareLayout = () => {
  const peersSharing = useHMSStore(selectPeersScreenSharing);
  const peers = useHMSStore(selectPeers);
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
    <RoleProminenceLayout.Root>
      <RoleProminenceLayout.ProminentSection css={{ pr: '$8', pb: '$8' }}>
        <ScreenshareTile peerId={peersSharing[page].id} />
        <Pagination page={page} onPageChange={setPage} numPages={peersSharing.length} />
      </RoleProminenceLayout.ProminentSection>
      <SecondaryTiles peers={secondaryPeers} />
    </RoleProminenceLayout.Root>
  );
};
