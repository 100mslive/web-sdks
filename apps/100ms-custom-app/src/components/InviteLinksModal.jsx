import React, { Fragment } from 'react';
import { Dialog, Flex, HorizontalDivider, textEllipsis, Text, IconButton, Box } from '@100mslive/react-ui';
import { DialogContent } from './DialogContent';
import copy from '../assets/images/icons/copy.svg';

const InviteLinksModal = ({ onClose, roomLinks }) => {
  return (
    <Dialog.Root defaultOpen onOpenChange={value => !value && onClose()}>
      <DialogContent title="Role Urls">
        <Box css={{ mt: '$8' }}>
          {roomLinks &&
            Object.keys(roomLinks).map(role => {
              const roomRole = roomLinks[role];
              if (roomRole.is_active) {
                let roleUrl = `https://${window.location.hostname}/preview/${roomRole.identifier}`;
                return (
                  <Fragment key={role}>
                    <Flex align="center" css={{ my: '$8' }}>
                      <Text css={{ width: '$36' }}>{role}</Text>
                      <Flex
                        justify="between"
                        align="center"
                        css={{ border: '1px solid $grayDefault', r: '$1', p: '$4', flex: '1 1 0' }}
                      >
                        <Text css={{ ...textEllipsis('90%'), flex: '1 1 0' }}>{roleUrl}</Text>
                        <IconButton
                          onClick={() => {
                            navigator.clipboard.writeText(roleUrl);
                          }}
                        >
                          <img src={copy} alt="copy icon" width={18} height={18} />
                        </IconButton>
                      </Flex>
                    </Flex>
                    <HorizontalDivider />
                  </Fragment>
                );
              }
              return null;
            })}
        </Box>
      </DialogContent>
    </Dialog.Root>
  );
};

export default InviteLinksModal;
