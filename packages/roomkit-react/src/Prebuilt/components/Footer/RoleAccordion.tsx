import React, { useEffect } from 'react';
import { useMeasure } from 'react-use';
import { FixedSizeList } from 'react-window';
import { HMSPeer, selectIsLargeRoom, useHMSStore, usePaginatedParticipants } from '@100mslive/react-sdk';
import { ChevronRightIcon } from '@100mslive/react-icons';
import { Accordion } from '../../../Accordion';
import { Flex } from '../../../Layout';
import { Text } from '../../../Text';
// @ts-ignore: No implicit Any
import { Participant } from './ParticipantList';
import { RoleOptions } from './RoleOptions';
// @ts-ignore: No implicit Any
import { getFormattedCount } from '../../common/utils';

export const ROW_HEIGHT = 50;
const ITER_TIMER = 5000;

export interface ItemData {
  peerList: HMSPeer[];
  isConnected: boolean;
}

export function itemKey(index: number, data: ItemData) {
  return data.peerList[index].id;
}

export const VirtualizedParticipantItem = React.memo(({ index, data }: { index: number; data: ItemData }) => {
  return <Participant key={data.peerList[index].id} peer={data.peerList[index]} isConnected={data.isConnected} />;
});

export const RoleAccordion = ({
  peerList = [],
  roleName,
  isConnected,
  filter,
  isHandRaisedAccordion = false,
  offStageRoles,
  onActive,
}: ItemData & {
  roleName: string;
  isHandRaisedAccordion?: boolean;
  filter?: { search: string };
  offStageRoles: string[];
  onActive?: (role: string) => void;
}) => {
  const [ref, { width }] = useMeasure<HTMLDivElement>();
  const showAcordion = filter?.search ? peerList.some(peer => peer.name.toLowerCase().includes(filter.search)) : true;
  const isLargeRoom = useHMSStore(selectIsLargeRoom);
  const { peers, total, loadPeers } = usePaginatedParticipants({ role: roleName, limit: 10 });
  const isOffStageRole = roleName && offStageRoles.includes(roleName);

  useEffect(() => {
    if (!isOffStageRole || !isLargeRoom) {
      return;
    }
    loadPeers();
    const interval = setInterval(() => {
      loadPeers();
    }, ITER_TIMER);
    return () => clearInterval(interval);
  }, [isOffStageRole, isLargeRoom]); //eslint-disable-line

  if (!showAcordion || (isHandRaisedAccordion && filter?.search) || (peerList.length === 0 && filter?.search)) {
    return null;
  }

  const height = ROW_HEIGHT * (peers.length || peerList.length);
  const peersInAccordion = isOffStageRole && isLargeRoom ? peers : peerList;
  const hasNext = total > peersInAccordion.length;

  if (peersInAccordion.length === 0) {
    return null;
  }

  return (
    <Accordion.Item value={roleName} css={{ '&:hover .role_actions': { visibility: 'visible' }, mb: '$8' }} ref={ref}>
      <Accordion.Header
        iconStyles={{ c: '$on_surface_high' }}
        css={{
          textTransform: 'capitalize',
          p: '$6 $8',
          fontSize: '$sm',
          fontWeight: '$semiBold',
          c: '$on_surface_medium',
          borderRadius: '$1',
          border: '1px solid $border_default',
          '&[data-state="open"]': {
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
          },
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
      <Accordion.Content contentStyles={{ border: '1px solid $border_default', borderTop: 'none' }}>
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
        {offStageRoles?.includes(roleName) && hasNext ? (
          <Flex
            align="center"
            justify="end"
            css={{
              gap: '$1',
              cursor: 'pointer',
              color: '$on_surface_high',
              p: '$6',
              borderTop: '1px solid $border_default',
            }}
            onClick={() => onActive?.(roleName)}
          >
            <Text variant="sm" css={{ color: 'inherit' }}>
              View All
            </Text>
            <ChevronRightIcon />
          </Flex>
        ) : null}
      </Accordion.Content>
    </Accordion.Item>
  );
};
