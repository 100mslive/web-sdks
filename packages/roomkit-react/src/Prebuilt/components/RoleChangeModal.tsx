import React, { useState } from 'react';
import { selectPeerByID, useHMSActions, useHMSStore } from '@100mslive/react-sdk';
import { ChevronDownIcon, ChevronUpIcon } from '@100mslive/react-icons';
import { Button } from '../../Button';
import { Dropdown } from '../../Dropdown';
import { Box, Flex } from '../../Layout';
import { Dialog } from '../../Modal';
import { Text } from '../../Text';
import { Tooltip } from '../../Tooltip';
// @ts-ignore
import { useDropdownSelection } from './hooks/useDropdownSelection';
import { useFilteredRoles } from '../common/hooks';

const HighlightTerm = ({ value }: { value: string | undefined }) => {
  return value ? (
    <Tooltip side="top" title={value}>
      <Text
        variant="body2"
        css={{
          color: '$on_surface_medium',
          fontWeight: '$semiBold',
        }}
      >
        '{value.slice(0, 100)}
        {value.length > 100 ? '...' : ''}'
      </Text>
    </Tooltip>
  ) : (
    <></>
  );
};

export const RoleChangeModal = ({
  peerId,
  onOpenChange,
}: {
  peerId: string;
  onOpenChange: (open: boolean) => void;
}) => {
  const peer = useHMSStore(selectPeerByID(peerId));
  const roles = useFilteredRoles();
  const [selectedRole, setRole] = useState(roles.filter(role => role !== peer?.roleName)?.[0] || peer?.roleName);
  const hmsActions = useHMSActions();
  const [open, setOpen] = useState(false);
  const selectionBg = useDropdownSelection();

  if (!peer) {
    return null;
  }

  return (
    <Dialog.Root defaultOpen onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Content css={{ width: 'min(400px,80%)', p: '$10' }}>
          <Dialog.Title css={{ p: 0 }} asChild>
            <Text as="h6" variant="h6">
              Switch Role
            </Text>
          </Dialog.Title>
          <Dialog.Description asChild>
            <Text
              variant="body2"
              css={{
                mt: '$4',
                mb: '$8',
                c: '$on_surface_medium',
                display: 'flex',
                flexWrap: 'wrap',
                columnGap: '4px',
              }}
            >
              Switch the role of
              <HighlightTerm value={peer.name} />
              from <HighlightTerm value={peer.roleName} />
            </Text>
          </Dialog.Description>
          <Flex
            align="center"
            css={{
              w: '100%',
              mb: '$10',
            }}
          >
            <Box
              css={{
                position: 'relative',
                flex: '1 1 0',
                minWidth: 0,
              }}
            >
              <Dropdown.Root open={open} onOpenChange={setOpen} css={{ width: '100%' }}>
                <Dropdown.Trigger
                  data-testid="open_role_selection_dropdown"
                  asChild
                  css={{
                    border: '1px solid $border_bright',
                    bg: '$surface_default',
                    r: '$1',
                    p: '$6 $9',
                  }}
                >
                  <Flex align="center" justify="between" css={{ width: '100%' }}>
                    <Text>{selectedRole}</Text>
                    {open ? <ChevronUpIcon /> : <ChevronDownIcon />}
                  </Flex>
                </Dropdown.Trigger>
                <Dropdown.Portal>
                  <Dropdown.Content align="start" sideOffset={8} css={{ zIndex: 1000 }}>
                    {roles.map(role => {
                      return (
                        <Dropdown.Item
                          data-testid={role}
                          key={role}
                          onSelect={() => setRole(role)}
                          css={{
                            px: '$9',
                            bg: role === selectedRole ? selectionBg : undefined,
                          }}
                        >
                          {role}
                        </Dropdown.Item>
                      );
                    })}
                  </Dropdown.Content>
                </Dropdown.Portal>
              </Dropdown.Root>
            </Box>
          </Flex>
          <Flex justify="center" align="center" css={{ width: '100%', gap: '$md' }}>
            <Button
              variant="standard"
              outlined
              css={{ width: '100%' }}
              onClick={() => setOpen(false)}
              data-testid="cancel_button"
            >
              Cancel
            </Button>

            <Button
              data-testid="change_button"
              variant="primary"
              css={{ width: '100%' }}
              onClick={async () => {
                if (selectedRole) {
                  await hmsActions.changeRoleOfPeer(peerId, selectedRole, true);
                  onOpenChange(false);
                }
              }}
            >
              Switch Role
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
