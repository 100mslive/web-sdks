import React, { useEffect, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { useMeasure } from 'react-use';
import { VariableSizeList } from 'react-window';
import { selectIsConnectedToRoom, useHMSStore, usePaginatedParticipants } from '@100mslive/react-sdk';
import { ChevronLeftIcon, CrossIcon } from '@100mslive/react-icons';
import { IconButton } from '../../../IconButton';
import { Box, Flex } from '../../../Layout';
import { Loading } from '../../../Loading';
import { Text } from '../../../Text';
import { Participant, ParticipantSearch } from './ParticipantList';
import { ItemData, itemKey, ROW_HEIGHT } from './RoleAccordion';
// @ts-ignore: No implicit Any
import { useSidepaneReset } from '../AppData/useSidepane';
// @ts-ignore: No implicit Any
import { getFormattedCount } from '../../common/utils';

const LoadMoreParticipants = ({
  hasNext,
  loadMore,
  style,
}: {
  hasNext: boolean;
  loadMore: () => Promise<void>;
  style: React.CSSProperties;
}) => {
  const { ref, inView } = useInView();
  const [inProgress, setInProgress] = useState(false);

  useEffect(() => {
    if (hasNext && inView && !inProgress) {
      setInProgress(true);
      loadMore()
        .catch(console.error)
        .finally(() => setInProgress(false));
    }
  }, [hasNext, loadMore, inView, inProgress]);
  return (
    <Flex ref={ref} style={style} align="center" justify="center">
      {inProgress ? <Loading size={16} /> : null}
    </Flex>
  );
};

const VirtualizedParticipantItem = React.memo(
  ({
    index,
    data,
    style,
  }: {
    index: number;
    data: ItemData & { hasNext: boolean; loadMorePeers: () => Promise<void> };
    style: React.CSSProperties;
  }) => {
    if (!data.peerList[index]) {
      return <LoadMoreParticipants hasNext={data.hasNext} loadMore={data.loadMorePeers} style={style} />;
    }
    return (
      <Participant
        key={data.peerList[index].id}
        peer={data.peerList[index]}
        isConnected={data.isConnected}
        style={style}
      />
    );
  },
);

export const PaginatedParticipants = ({ roleName, onBack }: { roleName: string; onBack: () => void }) => {
  const { peers, total, hasNext, loadPeers, loadMorePeers } = usePaginatedParticipants({ role: roleName, limit: 20 });
  const [search, setSearch] = useState<string>('');
  const filteredPeers = peers.filter(p => p.name?.toLowerCase().includes(search?.toLowerCase()));
  const isConnected = useHMSStore(selectIsConnectedToRoom);
  const [ref, { width }] = useMeasure<HTMLDivElement>();
  const height = ROW_HEIGHT * (filteredPeers.length + 1);
  const resetSidePane = useSidepaneReset();

  useEffect(() => {
    loadPeers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Flex ref={ref} direction="column" css={{ size: '100%', gap: '4' }}>
      <Flex align="center">
        <Flex align="center" css={{ flex: '1 1 0', cursor: 'pointer' }} onClick={onBack}>
          <ChevronLeftIcon />
          <Text variant="lg" css={{ flex: '1 1 0' }}>
            Participants
          </Text>
        </Flex>
        <IconButton
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            resetSidePane();
          }}
          data-testid="close_sidepane"
        >
          <CrossIcon />
        </IconButton>
      </Flex>
      <ParticipantSearch onSearch={(search: string) => setSearch(search)} placeholder={`Search for ${roleName}`} />
      <Flex direction="column" css={{ border: '1px solid border.default', borderRadius: '1', flex: '1 1 0' }}>
        <Flex align="center" css={{ height: ROW_HEIGHT, borderBottom: '1px solid border.default', px: '8' }}>
          <Text css={{ fontSize: '$space$7' }}>
            {roleName}({getFormattedCount(peers.length)}/{getFormattedCount(total)})
          </Text>
        </Flex>
        <Box css={{ flex: '1 1 0', overflowY: 'auto', overflowX: 'hidden', mr: '-$10' }}>
          {/* @ts-expect-error React 19 type incompatibility with react-window */}
          <VariableSizeList
            itemSize={index => (index === filteredPeers.length + 1 ? 16 : ROW_HEIGHT)}
            itemData={{ peerList: filteredPeers, hasNext: hasNext(), loadMorePeers, isConnected: isConnected === true }}
            itemKey={itemKey}
            itemCount={filteredPeers.length + 1}
            width={width}
            height={height}
          >
            {VirtualizedParticipantItem}
          </VariableSizeList>
        </Box>
      </Flex>
    </Flex>
  );
};
