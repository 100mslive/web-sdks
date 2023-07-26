import React, { useRef, useState } from 'react';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  CrossIcon,
  LinkIcon,
} from '@100mslive/react-icons';
import {
  Box,
  Button,
  Dialog,
  Dropdown,
  Flex,
  IconButton,
  QRCode,
  Text,
} from '@100mslive/roomkit-react';

const InviteLinksModal = ({ onClose, roomLinks }) => {
  const roles = Object.keys(roomLinks);
  const [selectedRole, setSelectedRole] = useState(roles[0]);
  const [open, setOpen] = useState(false);
  const ref = useRef();
  return (
    <Dialog.Root defaultOpen onOpenChange={value => !value && onClose()}>
      <Dialog.Portal>
        <Dialog.Content
          css={{ w: 'min(684px, 90%)', height: 'min(492px, 100%)' }}
        >
          <Flex direction="column" css={{ size: '100%' }}>
            <SubHeading css={{ mb: '$2' }}>Invite People</SubHeading>
            <Text variant="h6">Start the conversation</Text>
            <Flex css={{ pt: '$14', flex: '1 1 0', w: '100%' }}>
              <LeftContainer>
                <SubHeading>Select Role</SubHeading>
                <Dropdown.Root open={open} onOpenChange={setOpen}>
                  <Dropdown.Trigger
                    asChild
                    ref={ref}
                    css={{
                      border: '1px solid $border_bright',
                      bg: '$surface_bright',
                      r: '$1',
                      p: '$6 $9',
                      mt: '$4',
                    }}
                  >
                    <Flex align="center">
                      <Text css={{ mr: '$4', flex: '1 1 0' }}>
                        {selectedRole}
                      </Text>
                      {open ? <ChevronUpIcon /> : <ChevronDownIcon />}
                    </Flex>
                  </Dropdown.Trigger>
                  <Dropdown.Portal>
                    <Dropdown.Content
                      align="start"
                      sideOffset={8}
                      css={{ w: ref.current?.clientWidth, zIndex: 1000 }}
                    >
                      {roles.map(role => {
                        return (
                          <Dropdown.Item
                            key={role}
                            css={{
                              bg:
                                selectedRole === role
                                  ? '$primary_dim'
                                  : undefined,
                              px: '$9',
                            }}
                            onClick={() => setSelectedRole(role)}
                          >
                            {role}
                          </Dropdown.Item>
                        );
                      })}
                    </Dropdown.Content>
                  </Dropdown.Portal>
                </Dropdown.Root>
                <Text
                  variant="sm"
                  css={{ color: '$on_surface_medium', my: '$10' }}
                >
                  Select a role with relevant permissions that you want to
                  share, to join the room.
                </Text>
                <Button
                  icon
                  variant="standard"
                  css={{ mt: 'auto' }}
                  onClick={() => {
                    navigator.clipboard?.writeText(
                      getRoomUrl(roomLinks[selectedRole])
                    );
                  }}
                >
                  <LinkIcon /> Copy Invite Link
                </Button>
              </LeftContainer>
              <RightContainer>
                <SubHeading>
                  Scan this QR code on your device to join as this role
                </SubHeading>
                <Box
                  css={{
                    flex: '1 1 0',
                    my: '$10',
                    bg: '#FFF',
                    r: '$1',
                    px: '$8',
                  }}
                >
                  <QRCode value={getRoomUrl(roomLinks[selectedRole])} />
                </Box>
              </RightContainer>
            </Flex>
          </Flex>
          <Dialog.Close
            css={{ position: 'absolute', right: '$10', top: '$10' }}
          >
            <IconButton as="div">
              <CrossIcon />
            </IconButton>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

const SubHeading = ({ children, css = {} }) => {
  return (
    <Text
      variant="tiny"
      css={{ color: '$on_surface_medium', textTransform: 'uppercase', ...css }}
    >
      {children}
    </Text>
  );
};

const LeftContainer = ({ children }) => {
  return (
    <Flex
      direction="column"
      css={{
        position: 'relative',
        minWidth: 0,
        flex: '1 1 0',
        mr: '$14',
        h: '100%',
      }}
    >
      {children}
    </Flex>
  );
};

const RightContainer = ({ children }) => {
  return (
    <Flex
      direction="column"
      css={{
        p: '$10 $14',
        w: '45%',
        h: '100%',
        border: '1px solid $border_bright',
        bg: '$surface_bright',
        r: '$1',
        textAlign: 'center',
      }}
    >
      {children}
    </Flex>
  );
};

function getRoomUrl(roomLink) {
  const isStreaming = window.location.pathname.startsWith('/streaming');
  return `https://${roomLink.subdomain}${
    isStreaming ? '/streaming' : ''
  }/preview/${roomLink.identifier}`;
}

export default InviteLinksModal;
