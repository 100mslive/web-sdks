import React from 'react';
import { useMeasure } from 'react-use';
import { FixedSizeList } from 'react-window';
import { Accordion } from '../../../Accordion';
import { Box, Flex } from '../../../Layout';
import { Text } from '../../../Text';
import { Participant } from './ParticipantList';
import { RoleOptions } from './RoleOptions';
import { getFormattedCount } from '../../common/utils';

const ROW_HEIGHT = 50;

function itemKey(index, data) {
  return data.peerList[index].id;
}

const VirtualizedParticipantItem = React.memo(({ index, data }) => {
  return (
    <Participant
      key={data.peerList[index].id}
      peer={data.peerList[index]}
      isConnected={data.isConnected}
      setSelectedPeerId={data.setSelectedPeerId}
    />
  );
});

export const RoleAccordion = ({
  peerList = [],
  roleName,
  setSelectedPeerId,
  isConnected,
  filter,
  isHandRaisedAccordion = false,
}) => {
  const [ref, { width }] = useMeasure();
  const showAcordion = filter?.search ? peerList.some(peer => peer.name.toLowerCase().includes(filter.search)) : true;

  if (!showAcordion || (isHandRaisedAccordion && filter?.search) || peerList.length === 0) {
    return null;
  }
  const height = ROW_HEIGHT * peerList.length;

  return (
    <Flex direction="column" css={{ flexGrow: 1, '&:hover .role_actions': { visibility: 'visible' } }} ref={ref}>
      <Accordion.Root
        type="single"
        collapsible
        defaultValue={roleName}
        css={{ borderRadius: '$3', border: '1px solid $border_bright' }}
      >
        <Accordion.Item value={roleName}>
          <Accordion.Header
            css={{
              textTransform: 'capitalize',
              p: '$6 $8',
              fontSize: '$sm',
              fontWeight: '$semiBold',
              c: '$on_surface_medium',
            }}
          >
            <Flex justify="between" css={{ c: 'inherit', flexGrow: 1, pr: '$6' }}>
              <Text variant="sm" css={{ fontWeight: '$semiBold', textTransform: 'capitalize', c: 'inherit' }}>
                {roleName} {`(${getFormattedCount(peerList.length)})`}
              </Text>
              <RoleOptions roleName={roleName} peerList={peerList} />
            </Flex>
          </Accordion.Header>
          <Accordion.Content>
            <Box css={{ borderTop: '1px solid $border_default' }} />
            <FixedSizeList
              itemSize={ROW_HEIGHT}
              itemData={{ peerList, isConnected, setSelectedPeerId }}
              itemKey={itemKey}
              itemCount={peerList.length}
              width={width}
              height={height}
            >
              {VirtualizedParticipantItem}
            </FixedSizeList>
          </Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>
    </Flex>
  );
};
