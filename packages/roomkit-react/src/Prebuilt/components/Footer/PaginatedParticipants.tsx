import React, { useEffect, useState } from 'react';
import { useMeasure } from 'react-use';
import { FixedSizeList } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';
import { selectIsConnectedToRoom, useHMSStore, usePaginatedParticipants } from '@100mslive/react-sdk';
import { ChevronLeftIcon, CrossIcon } from '@100mslive/react-icons';
import { IconButton } from '../../../IconButton';
import { Box, Flex } from '../../../Layout';
import { Loading } from '../../../Loading';
import { Text } from '../../../Text';
// @ts-ignore: No implicit Any
import { Participant, ParticipantSearch } from './ParticipantList';
import { ItemData, itemKey, ROW_HEIGHT } from './RoleAccordion';
// @ts-ignore: No implicit Any
import { useSidepaneReset } from '../AppData/useSidepane';

export const PaginatedParticipants = ({ roleName, onBack }: { roleName: string; onBack: () => void }) => {
  const { peers, total, loadPeers, loadMorePeers } = usePaginatedParticipants({ role: roleName, limit: 20 });
  const [search, setSearch] = useState<string>('');
  const filteredPeers = peers.filter(p => p.name?.toLowerCase().includes(search));
  const isConnected = useHMSStore(selectIsConnectedToRoom);
  const [ref, { width }] = useMeasure<HTMLDivElement>();
  const height = ROW_HEIGHT * peers.length;
  const resetSidePane = useSidepaneReset();
  const isItemLoaded = (index: number) => !!filteredPeers[index];

  const VirtualizedParticipantItem = React.memo(({ index, data }: { index: number; data: ItemData }) => {
    if (!isItemLoaded(index)) {
      return (
        <Flex align="center" justify="center" css={{ w: '100%', h: ROW_HEIGHT }}>
          <Loading />
        </Flex>
      );
    }
    return <Participant key={data.peerList[index].id} peer={data.peerList[index]} isConnected={data.isConnected} />;
  });

  useEffect(() => {
    loadPeers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Flex ref={ref} direction="column" css={{ size: '100%', gap: '$4' }}>
      <Flex align="center">
        <Flex align="center" css={{ flex: '1 1 0', cursor: 'pointer' }} onClick={onBack}>
          <ChevronLeftIcon />
          <Text variant="lg" css={{ flex: '1 1 0' }}>
            Participants
          </Text>
        </Flex>
        <IconButton
          onClick={e => {
            e.stopPropagation();
            resetSidePane();
          }}
          data-testid="close_sidepane"
        >
          <CrossIcon />
        </IconButton>
      </Flex>
      <ParticipantSearch onSearch={(search: string) => setSearch(search)} placeholder={`Search for ${roleName}`} />
      <Flex direction="column" css={{ border: '1px solid $border_default', borderRadius: '$1' }}>
        <Flex align="center" css={{ height: ROW_HEIGHT, borderBottom: '1px solid $border_default', px: '$8' }}>
          <Text css={{ fontSize: '$space$7' }}>{roleName}</Text>
        </Flex>
        <Box css={{ flex: '1 1 0' }}>
          <InfiniteLoader isItemLoaded={isItemLoaded} itemCount={total} loadMoreItems={loadMorePeers}>
            {({ onItemsRendered, ref }) => (
              <FixedSizeList
                itemSize={ROW_HEIGHT}
                itemData={{ peerList: filteredPeers, isConnected: isConnected === true }}
                itemKey={itemKey}
                onItemsRendered={onItemsRendered}
                itemCount={filteredPeers.length}
                width={width}
                height={height}
                ref={ref}
              >
                {VirtualizedParticipantItem}
              </FixedSizeList>
            )}
          </InfiniteLoader>
        </Box>
      </Flex>
    </Flex>
  );
};
