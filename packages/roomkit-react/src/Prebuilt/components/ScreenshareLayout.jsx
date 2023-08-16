import React, { useEffect, useMemo, useState } from 'react';
import { selectPeers, selectPeersScreenSharing, useHMSStore } from '@100mslive/react-sdk';
import { Box, Flex } from '../../Layout';
import { Pagination } from './Pagination';
import ScreenshareTile from './ScreenshareTile';
import { SecondaryTiles } from './SecondaryTiles';
import { useSetAppDataByKey } from './AppData/useUISettings';
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
  }, [activeSharePeerId, setActiveScreenSharePeer]);

  return (
    <Flex direction="column">
      <Box css={{ flex: '1 1 0', minHeight: 0 }}>
        <ScreenshareTile peerId={peersSharing[page].id} />
      </Box>
      {peersSharing.length > 1 && <Pagination page={page} onPageChange={setPage} numPages={peersSharing.length} />}
      <SecondaryTiles peers={secondaryPeers} />
    </Flex>
  );
};
