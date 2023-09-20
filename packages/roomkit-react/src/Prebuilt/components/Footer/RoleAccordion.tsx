import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useMeasure } from 'react-use';
import { FixedSizeList } from 'react-window';
import { HMSPeer, HMSPeerListIterator, useHMSActions } from '@100mslive/react-sdk';
import { AddCircleIcon } from '@100mslive/react-icons';
import { Accordion } from '../../../Accordion';
import { Box, Flex } from '../../../Layout';
import { Text } from '../../../Text';
import Chip from '../Chip';
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

function itemKey(index: number, data: ItemData) {
  return data.peerList[index].id;
}

const VirtualizedParticipantItem = React.memo(({ index, data }: { index: number; data: ItemData }) => {
  return <Participant key={data.peerList[index].id} peer={data.peerList[index]} isConnected={data.isConnected} />;
});

export const RoleAccordion = ({
  peerList = [],
  roleName,
  isConnected,
  filter,
  isHandRaisedAccordion = false,
}: ItemData & {
  roleName: string;
  isHandRaisedAccordion?: boolean;
  filter?: { search: string };
}) => {
  const [ref, { width }] = useMeasure<HTMLDivElement>();
  const actions = useHMSActions();
  const showAcordion = filter?.search ? peerList.some(peer => peer.name.toLowerCase().includes(filter.search)) : true;
  const [hasNext, setHasNext] = useState(false);
  const iteratorRef = useRef<HMSPeerListIterator | null>(null);

  const loadNext = useCallback(() => {
    if (!roleName || roleName === 'Hand Raised') {
      return;
    }
    if (!iteratorRef.current) {
      iteratorRef.current = actions.getPeerListIterator({ role: roleName });
    }
    iteratorRef.current
      .next()
      .catch(console.error)
      .finally(() => {
        setHasNext(iteratorRef.current ? iteratorRef.current.hasNext() : false);
      });
  }, [actions, roleName]);

  useEffect(() => {
    loadNext();
  }, [loadNext]);

  if (!showAcordion || (isHandRaisedAccordion && filter?.search) || (peerList.length === 0 && filter?.search)) {
    return null;
  }

  const height = ROW_HEIGHT * peerList.length;

  return (
    <Flex direction="column" css={{ '&:hover .role_actions': { visibility: 'visible' } }} ref={ref}>
      <Accordion.Root
        type="single"
        collapsible
        defaultValue={roleName}
        css={{ borderRadius: '$1', border: '1px solid $border_bright' }}
      >
        <Accordion.Item value={roleName}>
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
                {roleName} {`(${getFormattedCount(peerList.length)})`}
              </Text>
              <RoleOptions roleName={roleName} peerList={peerList} />
            </Flex>
          </Accordion.Header>
          <Accordion.Content>
            <Box css={{ borderTop: '1px solid $border_default' }} />
            <FixedSizeList
              itemSize={ROW_HEIGHT}
              itemData={{ peerList, isConnected }}
              itemKey={itemKey}
              itemCount={peerList.length}
              width={width}
              height={height}
            >
              {VirtualizedParticipantItem}
            </FixedSizeList>
            {hasNext ? (
              <Chip
                icon={<AddCircleIcon />}
                content="Load More"
                onClick={loadNext}
                backgroundColor="$secodary_default"
                css={{
                  w: 'max-content',
                  borderRadius: '$size$9',
                  m: '$2 auto',
                  p: '$4',
                  cursor: 'pointer',
                }}
              />
            ) : null}
          </Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>
    </Flex>
  );
};
