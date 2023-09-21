import React, { useCallback, useEffect, useState } from 'react';
import { useMeasure } from 'react-use';
import { FixedSizeList } from 'react-window';
import { HMSPeer, HMSPeerListIterator, selectIsLargeRoom, useHMSActions, useHMSStore } from '@100mslive/react-sdk';
import { ChevronLeftIcon, ChevronRightIcon } from '@100mslive/react-icons';
import { Accordion } from '../../../Accordion';
import { Box, Flex } from '../../../Layout';
import { Text } from '../../../Text';
// @ts-ignore: No implicit Any
import { Participant } from './ParticipantList';
import { RoleOptions } from './RoleOptions';
// @ts-ignore: No implicit Any
import { getFormattedCount } from '../../common/utils';

const ROW_HEIGHT = 50;

interface ItemData {
  peerList: HMSPeer[];
  isConnected: boolean;
}

type ActionType = 'previous' | 'next';

function itemKey(index: number, data: ItemData) {
  return data.peerList[index].id;
}

const VirtualizedParticipantItem = React.memo(({ index, data }: { index: number; data: ItemData }) => {
  return <Participant key={data.peerList[index].id} peer={data.peerList[index]} isConnected={data.isConnected} />;
});

const peerlistIterators = new Map<string, HMSPeerListIterator>();
export const RoleAccordion = ({
  peerList = [],
  roleName,
  isConnected,
  filter,
  isHandRaisedAccordion = false,
  offStageRoles,
}: ItemData & {
  roleName: string;
  isHandRaisedAccordion?: boolean;
  filter?: { search: string };
  offStageRoles: string[];
}) => {
  const [ref, { width }] = useMeasure<HTMLDivElement>();
  const actions = useHMSActions();
  const showAcordion = filter?.search ? peerList.some(peer => peer.name.toLowerCase().includes(filter.search)) : true;
  const isLargeRoom = useHMSStore(selectIsLargeRoom);
  const [peers, setPeers] = useState<HMSPeer[]>([]);
  const [total, setTotal] = useState(0);
  const isOffStageRole = roleName && offStageRoles.includes(roleName);

  const loadData = useCallback(
    (type: ActionType) => {
      if (roleName === 'Hand Raised' || !isOffStageRole) {
        return;
      }
      let iterator = peerlistIterators.get(roleName);
      if (!iterator) {
        iterator = actions.getPeerListIterator({ role: roleName });
        peerlistIterators.set(roleName, iterator);
      }
      iterator?.[type]()
        .then(peers => {
          setPeers(peers);
          setTotal(iterator?.getTotal() || 0);
        })
        .catch(console.error);
    },
    [actions, roleName, isOffStageRole],
  );

  useEffect(() => {
    loadData('next');
  }, [loadData]);

  if (!showAcordion || (isHandRaisedAccordion && filter?.search) || (peerList.length === 0 && filter?.search)) {
    return null;
  }

  const height = ROW_HEIGHT * (peers.length || peerList.length);
  const iterator = peerlistIterators.get(roleName);
  const hasPrevious = iterator?.hasPrevious();
  const hasNext = iterator?.hasNext();
  const peersInAccordion = isOffStageRole && isLargeRoom ? peers : peerList;

  return (
    <Accordion.Item value={roleName} css={{ '&:hover .role_actions': { visibility: 'visible' } }} ref={ref}>
      <Accordion.Header
        iconStyles={{ c: '$on_surface_high' }}
        css={{
          textTransform: 'capitalize',
          p: '$6 $8',
          fontSize: '$sm',
          fontWeight: '$semiBold',
          c: '$on_surface_medium',
        }}
      >
        <Flex justify="between" css={{ flexGrow: 1, pr: '$6' }}>
          <Text
            variant="sm"
            css={{ fontWeight: '$semiBold', textTransform: 'capitalize', color: '$on_surface_medium' }}
          >
            {roleName} {`(${getFormattedCount(isLargeRoom && isOffStageRole ? total : peerList.length)})`}
          </Text>
          <RoleOptions roleName={roleName} peerList={peersInAccordion} />
        </Flex>
      </Accordion.Header>
      <Accordion.Content>
        <Box css={{ borderTop: '1px solid $border_default' }} />
        <FixedSizeList
          itemSize={ROW_HEIGHT}
          itemData={{ peerList: peersInAccordion, isConnected }}
          itemKey={itemKey}
          itemCount={peersInAccordion.length}
          width={width}
          height={height}
        >
          {VirtualizedParticipantItem}
        </FixedSizeList>
        {offStageRoles?.includes(roleName) ? (
          <Flex justify="between" align="center" css={{ p: '$4' }}>
            <Flex
              align="center"
              css={{
                gap: '$1',
                pointerEvents: hasPrevious ? 'auto' : 'none',
                cursor: hasPrevious ? 'pointer' : 'not-allowed',
                color: hasPrevious ? '$on_surface_high' : '$on_surface_low',
              }}
              onClick={() => loadData('next')}
            >
              <ChevronLeftIcon />
              <Text variant="sm" css={{ color: 'inherit' }}>
                Previous
              </Text>
            </Flex>
            <Flex
              align="center"
              css={{
                gap: '$1',
                pointerEvents: hasNext ? 'auto' : 'none',
                cursor: hasNext ? 'pointer' : 'not-allowed',
                color: hasNext ? '$on_surface_high' : '$on_surface_low',
              }}
              onClick={() => loadData('previous')}
            >
              <Text variant="sm" css={{ color: 'inherit' }}>
                Next
              </Text>
              <ChevronRightIcon />
            </Flex>
          </Flex>
        ) : null}
      </Accordion.Content>
    </Accordion.Item>
  );
};
