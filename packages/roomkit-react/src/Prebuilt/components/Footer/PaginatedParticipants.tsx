import { CSSProperties, memo, useEffect, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { useMeasure } from 'react-use';
import { type RowComponentProps, List } from 'react-window';
import { selectIsConnectedToRoom, useHMSStore, usePaginatedParticipants } from '@100mslive/react-sdk';
import { ChevronLeftIcon, CrossIcon } from '@100mslive/react-icons';
import { IconButton } from '../../../IconButton';
import { Box, Flex } from '../../../Layout';
import { Loading } from '../../../Loading';
import { Text } from '../../../Text';
import { Participant, ParticipantSearch } from './ParticipantList';
import { ItemData, ROW_HEIGHT } from './RoleAccordion';
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
  style: CSSProperties;
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

const VirtualizedParticipantItem = memo(({ index, peerList, isConnected, style }: RowComponentProps<ItemData>) => {
  return <Participant key={peerList[index].id} peer={peerList[index]} isConnected={isConnected} style={style} />;
});

export const PaginatedParticipants = ({ roleName, onBack }: { roleName: string; onBack: () => void }) => {
  const { peers, total, hasNext, loadPeers, loadMorePeers } = usePaginatedParticipants({ role: roleName, limit: 20 });
  const [search, setSearch] = useState<string>('');
  const filteredPeers = peers.filter(p => p.name?.toLowerCase().includes(search?.toLowerCase()));
  const isConnected = useHMSStore(selectIsConnectedToRoom);
  const [ref, { width }] = useMeasure<HTMLDivElement>();
  const resetSidePane = useSidepaneReset();

  useEffect(() => {
    loadPeers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Flex direction="column" css={{ size: '100%', gap: '$4' }}>
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
        <Box ref={ref} css={{ flex: '1 1 0' }}>
          <List
            rowHeight={ROW_HEIGHT}
            rowProps={{
              peerList: filteredPeers,
              isConnected: isConnected === true,
            }}
            rowCount={filteredPeers.length}
            style={{ width, height: ROW_HEIGHT * filteredPeers.length }}
            rowComponent={VirtualizedParticipantItem}
          />
          {hasNext() && !search ? (
            <LoadMoreParticipants
              hasNext={hasNext()}
              loadMore={loadMorePeers}
              style={{ height: ROW_HEIGHT, width: '100%' }}
            />
          ) : null}
        </Box>
      </Flex>
    </Flex>
  );
};
