import React from 'react';
import { useMeasure } from 'react-use';
import { FixedSizeList } from 'react-window';
import { Accordion } from '../../../Accordion';
import { Box, Flex } from '../../../Layout';
import { Participant } from './ParticipantList';
import { getFormattedCount } from '../../common/utils';

const ROW_HEIGHT = 55;

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
  const height = ROW_HEIGHT * peerList.length;
  const showAcordion = filter?.search
    ? peerList.some(peer => peer.name.toLowerCase().includes(filter.search.toLowerCase()))
    : true;
  if (!showAcordion || (isHandRaisedAccordion && filter?.search) || peerList.length === 0) {
    return null;
  }

  return (
    <Flex direction="column" css={{ w: '100%' }} ref={ref}>
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
            {roleName} {`(${getFormattedCount(peerList.length)})`}
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
