import React, { useEffect, useRef, useState } from 'react';
import { useMedia } from 'react-use';
import { selectAppData, selectSessionStore, selectTrackByID, useHMSStore } from '@100mslive/react-sdk';
import { LayoutProps } from './VideoLayouts/interface';
import { ProminenceLayout } from './VideoLayouts/ProminenceLayout';
import { config as cssConfig } from '../../Theme';
import { Pagination } from './Pagination';
import { usePagesWithTiles } from './hooks/useTileLayout';
import { APP_DATA, SESSION_STORE_KEY } from '../common/constants';

export const SecondaryTiles = ({ peers, onPageChange, onPageSize, edgeToEdge, hasSidebar }: LayoutProps) => {
  const isMobile = useMedia(cssConfig.media.md);
  const maxTileCount = isMobile ? 2 : 4;
  const [page, setPage] = useState(0);
  const pinnedTrackId = useHMSStore(selectAppData(APP_DATA.pinnedTrackId));
  const spotlightPeerIds = useHMSStore(selectSessionStore(SESSION_STORE_KEY.SPOTLIGHT)) as string[] | undefined;
  const hasSpotlight = !!spotlightPeerIds?.length;
  const activeScreensharePeerId = useHMSStore(selectAppData(APP_DATA.activeScreensharePeerId));
  const pinnedPeer = useHMSStore(selectTrackByID(pinnedTrackId))?.peerId;
  const pageChangedAfterPinning = useRef(false);
  const pagesWithTiles = usePagesWithTiles({
    peers:
      hasSpotlight || pinnedPeer
        ? [...peers].sort((p1, p2) => {
            if (activeScreensharePeerId === p1.id) {
              return -1;
            }
            if (activeScreensharePeerId === p2.id) {
              return 1;
            }
            const peerIdList = [pinnedPeer, ...(spotlightPeerIds ?? [])];
            // put active screenshare peer, pinned peer, spotlight peer at first
            if (peerIdList.includes(p1.id)) {
              return -1;
            }
            if (peerIdList.includes(p2.id)) {
              return 1;
            }
            return 0;
          })
        : peers,
    maxTileCount,
  });
  const pageSize = pagesWithTiles[0]?.length || 0;

  // Handles final peer leaving from the last page
  useEffect(() => {
    if (peers.length > 0 && !pagesWithTiles[page]?.length) {
      setPage(Math.max(0, page - 1));
    }
  }, [peers, page, pagesWithTiles]);

  useEffect(() => {
    if (pageSize > 0) {
      onPageSize?.(pageSize);
    }
  }, [pageSize, onPageSize]);

  useEffect(() => {
    if ((pinnedPeer || hasSpotlight) && page !== 0 && !pageChangedAfterPinning.current) {
      setPage(0);
      pageChangedAfterPinning.current = true;
    } else if (!pinnedPeer && !hasSpotlight) {
      pageChangedAfterPinning.current = false;
    }
  }, [pinnedPeer, hasSpotlight, page]);

  return (
    <ProminenceLayout.SecondarySection tiles={pagesWithTiles[page]} edgeToEdge={edgeToEdge} hasSidebar={hasSidebar}>
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
    </ProminenceLayout.SecondarySection>
  );
};
