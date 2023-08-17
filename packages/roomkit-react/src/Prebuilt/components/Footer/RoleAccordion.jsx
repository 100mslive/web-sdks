import React from 'react';
import { Accordion } from '../../../Accordion';
import { Box } from '../../../Layout';
import { getFormattedCount } from '../../common/utils';
import { Participant } from './ParticipantList';

export const RoleAccordion = ({ peerList = [], roleName, setSelectedPeerId, isConnected }) => {
  return (
    <Box>
      <Accordion.Root
        type="single"
        collapsible
        defaultValue={roleName}
        css={{ borderRadius: '$3', border: '1px solid $border_default' }}
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
            <Box css={{ borderTop: '1px solid $border_bright' }} />
            {peerList.map(peer => (
              <Participant peer={peer} isConnected={isConnected} setSelectedPeerId={setSelectedPeerId} />
            ))}
          </Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>
    </Box>
  );
};
