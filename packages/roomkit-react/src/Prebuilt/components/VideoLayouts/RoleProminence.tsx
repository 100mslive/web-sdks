import React, { useEffect, useMemo, useState } from 'react';
import { useMedia } from 'react-use';
import { selectLocalPeer, useHMSStore, useHMSVanillaStore } from '@100mslive/react-sdk';
import { config as cssConfig } from '../../../Theme';
import { InsetTile } from '../InsetTile';
import { Pagination } from '../Pagination';
import { SecondaryTiles } from '../SecondaryTiles';
import { Grid } from './Grid';
import { LayoutProps } from './interface';
import { ProminenceLayout } from './ProminenceLayout';
// @ts-ignore: No implicit Any
import { useUISettings } from '../AppData/useUISettings';
import { useRoleProminencePeers } from '../hooks/useRoleProminencePeers';
import { usePagesWithTiles, useTileLayout } from '../hooks/useTileLayout';
import PeersSorter from '../../common/PeersSorter';
import { UI_SETTINGS } from '../../common/constants';

export function RoleProminence({
  isInsetEnabled = false,
  prominentRoles = [],
  peers,
  onPageChange,
  edgeToEdge,
}: LayoutProps) {
  const { prominentPeers, secondaryPeers } = useRoleProminencePeers(prominentRoles, peers, isInsetEnabled);
  const [sortedProminentPeers, setSortedProminentPeers] = useState(prominentPeers);
  const [sortedSecondaryPeers, setSortedSecondaryPeers] = useState(secondaryPeers);
  const localPeer = useHMSStore(selectLocalPeer);
  const isMobile = useMedia(cssConfig.media.md);
  let maxTileCount = useUISettings(UI_SETTINGS.maxTileCount);
  maxTileCount = isMobile ? 4 : maxTileCount;
  const pageList = usePagesWithTiles({
    peers: sortedProminentPeers,
    maxTileCount,
  });
  const { ref, pagesWithTiles } = useTileLayout({
    pageList,
    maxTileCount,
  });
  const [page, setPage] = useState(0);
  const pageSize = pagesWithTiles[0]?.length || 0;

  const [secondaryPage, setSecondaryPage] = useState(0);
  const [secondaryPageSize, setSecondaryPageSize] = useState(0);

  const vanillaStore = useHMSVanillaStore();
  const prominentPeerSorter = useMemo(() => new PeersSorter(vanillaStore), [vanillaStore]);
  const secondaryPeerSorter = useMemo(() => new PeersSorter(vanillaStore), [vanillaStore]);

  useEffect(() => {
    if (page !== 0) {
      return;
    }
    prominentPeerSorter.onUpdate(setSortedProminentPeers);
    prominentPeerSorter.setPeersAndTilesPerPage({
      peers: prominentPeers,
      tilesPerPage: pageSize,
    });
  }, [page, prominentPeerSorter, prominentPeers, pageSize]);

  useEffect(() => {
    if (secondaryPage !== 0) {
      return;
    }
    secondaryPeerSorter.onUpdate(setSortedSecondaryPeers);
    secondaryPeerSorter.setPeersAndTilesPerPage({
      peers: secondaryPeers,
      tilesPerPage: secondaryPageSize,
    });
  }, [secondaryPage, secondaryPeerSorter, secondaryPeers, secondaryPageSize]);

  return (
    <ProminenceLayout.Root>
      <ProminenceLayout.ProminentSection>
        <Grid ref={ref} tiles={pagesWithTiles[page]} />
      </ProminenceLayout.ProminentSection>
      {!edgeToEdge && (
        <Pagination
          page={page}
          onPageChange={page => {
            setPage(page);
            onPageChange?.(page);
          }}
          numPages={pagesWithTiles.length}
        />
      )}
      <SecondaryTiles
        peers={sortedSecondaryPeers}
        onPageChange={setSecondaryPage}
        onPageSize={setSecondaryPageSize}
        isInsetEnabled={isInsetEnabled}
        edgeToEdge={edgeToEdge}
      />
      {isInsetEnabled && localPeer && prominentPeers.length > 0 && !prominentPeers.includes(localPeer) && <InsetTile />}
    </ProminenceLayout.Root>
  );
}
