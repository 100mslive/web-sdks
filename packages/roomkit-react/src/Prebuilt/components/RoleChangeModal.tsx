import React, { useRef, useState } from 'react';
import { useMedia } from 'react-use';
import { HMSPeer, selectAvailableRoleNames, selectPeerByID, useHMSActions, useHMSStore } from '@100mslive/react-sdk';
import { ChevronDownIcon, ChevronUpIcon, CrossIcon } from '@100mslive/react-icons';
import { Button } from '../../Button';
import { Dropdown } from '../../Dropdown';
import { Box, Flex } from '../../Layout';
import { Dialog } from '../../Modal';
import { Sheet } from '../../Sheet';
import { Text } from '../../Text';
import { config as cssConfig } from '../../Theme';
import { Tooltip } from '../../Tooltip';

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

const RoleChangeContent = ({
  peer,
  onOpenChange,
  isMobile = false,
}: {
  peer: HMSPeer;
  onOpenChange: (open: boolean) => void;
  isMobile?: boolean;
}) => {
  const roles = useHMSStore(selectAvailableRoleNames).filter(
    role => role !== peer?.roleName && role !== '__internal_recorder',
  );
  const [selectedRole, setRole] = useState(roles.filter(role => role !== peer?.roleName)?.[0] || peer?.roleName);
  const hmsActions = useHMSActions();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | undefined>(undefined);

  return (
    <>
      <Flex align="center" justify="between" css={{ w: '100%' }}>
        <Text as="h6" variant="h6">
          Switch Role
        </Text>
        {isMobile && <CrossIcon onClick={() => onOpenChange(false)} />}
      </Flex>

      <Box>
        <Text
          variant="sm"
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
          from <HighlightTerm value={peer.roleName} /> to
        </Text>
      </Box>
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
              // @ts-ignore
              ref={triggerRef}
              data-testid="open_role_selection_dropdown"
              asChild
              css={{
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

            <Dropdown.Content align="start" sideOffset={8} css={{ zIndex: 1000, w: '100%' }}>
              {roles.map(role => (
                <Dropdown.Item
                  data-testid={role}
                  key={role}
                  onSelect={() => setRole(role)}
                  css={{ w: `${triggerRef.current?.clientWidth}px` }}
                >
                  {role}
                </Dropdown.Item>
              ))}
            </Dropdown.Content>
          </Dropdown.Root>
        </Box>
      </Flex>
      <Flex justify="center" align="center" css={{ width: '100%', gap: '$md' }}>
        {!isMobile && (
          <Button
            variant="standard"
            outlined
            css={{ width: '100%' }}
            onClick={() => onOpenChange(false)}
            data-testid="cancel_button"
          >
            Cancel
          </Button>
        )}

        <Button
          data-testid="change_button"
          variant="primary"
          css={{ width: '100%' }}
          onClick={async () => {
            if (selectedRole) {
              await hmsActions.changeRoleOfPeer(peer.id, selectedRole, true);
              onOpenChange(false);
            }
          }}
        >
          Switch Role
        </Button>
      </Flex>
    </>
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
  const isMobile = useMedia(cssConfig.media.md);

  if (!peer) {
    return null;
  }

  if (isMobile) {
    return (
      <Sheet.Root open={true} onOpenChange={onOpenChange} css={{ borderRadius: '$0 $0 0 0' }}>
        <Sheet.Content style={{ p: '$10 $8', background: '$surface_dim', border: '1px solid $border_default' }}>
          <RoleChangeContent peer={peer} onOpenChange={onOpenChange} isMobile />
        </Sheet.Content>
      </Sheet.Root>
    );
  }

  return (
    <Dialog.Root defaultOpen onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Content css={{ width: 'min(400px,80%)', p: '$10', overflow: 'visible' }}>
          <RoleChangeContent peer={peer} onOpenChange={onOpenChange} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
