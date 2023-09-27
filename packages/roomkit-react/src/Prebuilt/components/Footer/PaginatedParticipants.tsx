import React, { useEffect } from 'react';
import { useMeasure } from 'react-use';
import { FixedSizeList } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';
import { selectIsConnectedToRoom, useHMSStore, usePaginatedParticipants } from '@100mslive/react-sdk';
import { Box } from '../../../Layout';
import { itemKey, ROW_HEIGHT, VirtualizedParticipantItem } from './RoleAccordion';

export const PaginatedParticipants = ({ roleName }: { roleName: string }) => {
  const { peers, total, loadPeers, loadMorePeers } = usePaginatedParticipants({ role: roleName });
  const isConnected = useHMSStore(selectIsConnectedToRoom);
  const [ref, { width }] = useMeasure<HTMLDivElement>();
  const height = ROW_HEIGHT * peers.length;

  useEffect(() => {
    loadPeers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box ref={ref} css={{ size: '100%' }}>
      <InfiniteLoader isItemLoaded={(index: number) => !!peers[index]} itemCount={total} loadMoreItems={loadMorePeers}>
        {({ onItemsRendered, ref }) => (
          <FixedSizeList
            itemSize={ROW_HEIGHT}
            itemData={{ peerList: peers, isConnected: isConnected === true }}
            itemKey={itemKey}
            onItemsRendered={onItemsRendered}
            itemCount={peers.length}
            width={width}
            height={height}
            ref={ref}
          >
            {VirtualizedParticipantItem}
          </FixedSizeList>
        )}
      </InfiniteLoader>
    </Box>
  );
};
