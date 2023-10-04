import React, { useEffect, useRef, useState } from 'react';
import { useMeasure } from 'react-use';
import { FixedSizeList } from 'react-window';
import { selectIsConnectedToRoom, useHMSStore, usePaginatedParticipants } from '@100mslive/react-sdk';
import { ChevronLeftIcon, CrossIcon } from '@100mslive/react-icons';
import { Button } from '../../../Button';
import { IconButton } from '../../../IconButton';
import { Box, Flex } from '../../../Layout';
import { Loading } from '../../../Loading';
import { Text } from '../../../Text';
// @ts-ignore: No implicit Any
import { ParticipantSearch } from './ParticipantList';
import { itemKey, ROW_HEIGHT, VirtualizedParticipantItem } from './RoleAccordion';
// @ts-ignore: No implicit Any
import { useSidepaneReset } from '../AppData/useSidepane';
// @ts-ignore: No implicit Any
import { getFormattedCount } from '../../common/utils';

export const PaginatedParticipants = ({ roleName, onBack }: { roleName: string; onBack: () => void }) => {
  const { peers, total, loadPeers, loadMorePeers } = usePaginatedParticipants({ role: roleName, limit: 20 });
  const [search, setSearch] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const filteredPeers = peers.filter(p => p.name?.toLowerCase().includes(search));
  const isConnected = useHMSStore(selectIsConnectedToRoom);
  const [ref, { width }] = useMeasure<HTMLDivElement>();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const height = ROW_HEIGHT * peers.length;
  const resetSidePane = useSidepaneReset();
  const hasNext = total > peers.length;

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
      <Flex direction="column" css={{ border: '1px solid $border_default', borderRadius: '$1', flex: '1 1 0' }}>
        <Flex align="center" css={{ height: ROW_HEIGHT, borderBottom: '1px solid $border_default', px: '$8' }}>
          <Text css={{ fontSize: '$space$7' }}>
            {roleName}({getFormattedCount(peers.length)}/{getFormattedCount(total)})
          </Text>
        </Flex>
        <Box css={{ flex: '1 1 0', overflowY: 'auto', overflowX: 'hidden', mr: '-$10' }}>
          <FixedSizeList
            itemSize={ROW_HEIGHT}
            itemData={{ peerList: filteredPeers, isConnected: isConnected === true }}
            itemKey={itemKey}
            itemCount={filteredPeers.length}
            width={width}
            height={height}
            outerRef={containerRef}
          >
            {VirtualizedParticipantItem}
          </FixedSizeList>
          {hasNext ? (
            <Flex justify="center" css={{ w: '100%' }}>
              <Button
                css={{ w: 'max-content', p: '$4' }}
                onClick={() => {
                  setIsLoading(true);
                  loadMorePeers()
                    .catch(console.error)
                    .finally(() => setIsLoading(false));
                }}
                disabled={isLoading}
              >
                {isLoading ? <Loading size={16} /> : 'Load More'}
              </Button>
            </Flex>
          ) : null}
        </Box>
      </Flex>
    </Flex>
  );
};
