import React, { useEffect, useMemo, useState } from 'react';
import { useMedia } from 'react-use';
import { selectLocalPeer, selectPeers, selectRemotePeers, useHMSStore, useHMSVanillaStore } from '@100mslive/react-sdk';
import { Flex } from '../../../Layout';
import { config as cssConfig } from '../../../Theme';
import { InsetTile } from '../InsetView';
import { Pagination } from '../Pagination';
import { Grid } from './Grid';
import { useInsetEnabled } from '../../provider/roomLayoutProvider/hooks/useInsetEnabled';
// @ts-ignore: No implicit Any
import { useUISettings } from '../AppData/useUISettings';
import { usePagesWithTiles, useTileLayout } from '../hooks/useTileLayout';
import PeersSorter from '../../common/PeersSorter';
// @ts-ignore: No implicit Any
import { UI_SETTINGS } from '../../common/constants';

export function EqualProminence() {
  const isInsetEnabled = useInsetEnabled();
  const peers = useHMSStore(isInsetEnabled ? selectRemotePeers : selectPeers);
  const [sortedPeers, setSortedPeers] = useState(peers);
  const localPeer = useHMSStore(selectLocalPeer);
  const vanillaStore = useHMSVanillaStore();
  const isMobile = useMedia(cssConfig.media.md);
  let maxTileCount = useUISettings(UI_SETTINGS.maxTileCount);
  maxTileCount = isMobile ? Math.min(maxTileCount, 6) : maxTileCount;
  const inputPeers = useMemo(
    () => (sortedPeers.length === 0 ? (!localPeer ? [] : [localPeer]) : sortedPeers),
    [sortedPeers, localPeer],
  );
  const pageList = usePagesWithTiles({
    peers: inputPeers,
    maxTileCount,
  });
  const { ref, pagesWithTiles } = useTileLayout({
    pageList,
    maxTileCount,
  });
  const [page, setPage] = useState(0);
  const peersSorter = useMemo(() => new PeersSorter(vanillaStore), [vanillaStore]);
  const pageSize = pagesWithTiles[0]?.length;

  useEffect(() => {
    if (page !== 0) {
      return;
    }
    peersSorter.setPeersAndTilesPerPage({
      peers,
      tilesPerPage: pageSize || maxTileCount,
    });
    peersSorter.onUpdate(setSortedPeers);
  }, [page, peersSorter, peers, pageSize, maxTileCount]);

  return (
    <Flex direction="column" css={{ flex: '1 1 0', h: '100%', position: 'relative', minWidth: 0 }}>
      <Grid tiles={pagesWithTiles[page]} ref={ref} />
      <Pagination page={page} onPageChange={setPage} numPages={pagesWithTiles.length} />
      {isInsetEnabled && pageList.length > 0 && pageList[0][0].peer.id !== localPeer?.id && <InsetTile />}
    </Flex>
  );
}
