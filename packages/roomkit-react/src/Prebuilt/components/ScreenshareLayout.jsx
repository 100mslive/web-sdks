import React, { useEffect, useState } from 'react';
import { selectPeersScreenSharing, useHMSStore } from '@100mslive/react-sdk';
import { Flex } from '../../Layout';
import { Pagination } from './Pagination';
import ScreenshareTile from './ScreenshareTile';
import { useSetAppDataByKey } from './AppData/useUISettings';
import { APP_DATA } from '../common/constants';

export const ScreenshareLayout = () => {
  const peersSharing = useHMSStore(selectPeersScreenSharing);
  const [, setActiveScreenSharePeer] = useSetAppDataByKey(APP_DATA.activeScreensharePeerId);
  const [page, setPage] = useState(0);
  const activeSharePeerId = peersSharing[page]?.id;

  useEffect(() => {
    setActiveScreenSharePeer(activeSharePeerId);
  }, [activeSharePeerId, setActiveScreenSharePeer]);

  return (
    <Flex direction="column">
      <ScreenshareTile peerId={peersSharing[page].id} />
      {peersSharing.length > 1 && <Pagination page={page} onPageChange={setPage} numPages={peersSharing.length} />}
    </Flex>
  );
};
