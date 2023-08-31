import React, { useState } from 'react';
import { useMeasure } from 'react-use';
import { FixedSizeList } from 'react-window';
import { Accordion } from '../../../Accordion';
import { Box, Flex } from '../../../Layout';
import { Participant } from './ParticipantList';
import { getFormattedCount } from '../../common/utils';
import { Text } from '../../../Text';
import { MicOffIcon, PersonRectangleIcon, VerticalMenuIcon, VideoOffIcon } from '@100mslive/react-icons';
import { Dropdown } from '../../../Dropdown';
import { selectPermissions, useHMSStore } from '@100mslive/react-sdk';

const ROW_HEIGHT = 50;
const dropdownItemCSS = { backgroundColor: '$surface_default', gap: '$4' };
const optionTextCSS = { fontWeight: '$semiBold', color: '$on_surface_high', textTransform: 'none' };

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
  const permissions = useHMSStore(selectPermissions);
  const [openOptions, setOpenOptions] = useState(false);
  const height = ROW_HEIGHT * peerList.length;
  const showAcordion = filter?.search ? peerList.some(peer => peer.name.toLowerCase().includes(filter.search)) : true;
  if (!showAcordion || (isHandRaisedAccordion && filter?.search) || peerList.length === 0) {
    return null;
  }
  const showOptions = permissions?.changeRole || permissions?.mute || permissions?.unmute;

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
              {showOptions ? (
                <Dropdown.Root open={openOptions} onOpenChange={setOpenOptions}>
                  <Dropdown.Trigger
                    onClick={e => e.stopPropagation()}
                    className="role_actions"
                    asChild
                    css={{
                      p: '$1',
                      r: '$0',
                      c: '$on_surface_high',
                      visibility: openOptions ? 'visible' : 'hidden',
                      '&:hover': {
                        bg: '$surface_bright',
                      },
                      '@md': {
                        visibility: 'visible',
                      },
                    }}
                  >
                    <Flex>
                      <VerticalMenuIcon />
                    </Flex>
                  </Dropdown.Trigger>
                  <Dropdown.Content
                    onClick={e => e.stopPropagation()}
                    css={{ w: 'max-content', maxWidth: '$64', bg: '$surface_default', py: 0 }}
                    align="end"
                  >
                    {permissions.changeRole && (
                      <Dropdown.Item css={dropdownItemCSS}>
                        <PersonRectangleIcon />
                        <Text variant="sm" css={optionTextCSS}>
                          Remove all from Stage
                        </Text>
                      </Dropdown.Item>
                    )}
                    {permissions.mute && (
                      <>
                        <Dropdown.Item css={{ ...dropdownItemCSS, borderTop: '1px solid $border_bright' }}>
                          <MicOffIcon />
                          <Text variant="sm" css={optionTextCSS}>
                            Mute Audio
                          </Text>
                        </Dropdown.Item>

                        <Dropdown.Item css={{ ...dropdownItemCSS, borderTop: '1px solid $border_bright' }}>
                          <VideoOffIcon />
                          <Text variant="sm" css={optionTextCSS}>
                            Mute Video
                          </Text>
                        </Dropdown.Item>
                      </>
                    )}
                  </Dropdown.Content>
                </Dropdown.Root>
              ) : null}
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
