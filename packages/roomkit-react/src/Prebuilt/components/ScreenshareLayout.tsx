import React, { useEffect, useMemo, useState } from 'react';
import { selectPeers, selectPeersScreenSharing, useHMSStore } from '@100mslive/react-sdk';
import { Box, Flex } from '../../Layout';
// @ts-ignore: No implicit Any
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
    <Flex direction="column" css={{ size: '100%' }}>
      <Box css={{ flex: '1 1 0', minHeight: 0, pr: '$10' }}>
        <ScreenshareTile peerId={peersSharing[page].id} />
      </Box>
      {peersSharing.length > 1 && <Pagination page={page} onPageChange={setPage} numPages={peersSharing.length} />}
      <SecondaryTiles peers={secondaryPeers} />
    </Flex>
  );
};
