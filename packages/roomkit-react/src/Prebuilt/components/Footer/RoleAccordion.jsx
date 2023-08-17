import React from 'react';
import { Accordion } from '../../../Accordion';
import { Box } from '../../../Layout';
import { Participant } from './ParticipantList';
import { getFormattedCount } from '../../common/utils';

export const RoleAccordion = ({
  peerList = [],
  roleName,
  setSelectedPeerId,
  isConnected,
  filter,
  isHandRaisedAccordion = false,
}) => {
  const showAcordion = filter?.search ? peerList.some(peer => peer.name.includes(filter.search)) : true;
  if (!showAcordion || (isHandRaisedAccordion && filter?.search) || peerList.length === 0) {
    return null;
  }

  return (
    <Box>
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
            {peerList.map(peer => (
              <Participant peer={peer} isConnected={isConnected} setSelectedPeerId={setSelectedPeerId} />
            ))}
          </Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>
    </Box>
  );
};
