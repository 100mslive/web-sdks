import React, { Fragment, useState } from 'react';
import { useParams } from 'react-router-dom';
import { selectIsConnectedToRoom, selectPermissions, useHMSActions, useHMSStore } from '@100mslive/react-sdk';
import { AlertTriangleIcon, ExitIcon, HangUpIcon, StopIcon, VerticalMenuIcon } from '@100mslive/react-icons';
import { ToastManager } from './Toast/ToastManager';
import { Button } from '../../Button';
import { Dropdown } from '../../Dropdown';
import { IconButton } from '../../IconButton';
import { Box, Flex } from '../../Layout';
import { Dialog } from '../../Modal';
import { Text } from '../../Text';
import { styled } from '../../Theme';
import { Tooltip } from '../../Tooltip';
import { useHMSPrebuiltContext } from '../AppContext';
import { useDropdownList } from './hooks/useDropdownList';
import { useNavigation } from './hooks/useNavigation';

export const LeaveRoom = ({ showStreamingUI = false }) => {
  const navigate = useNavigation();
  const params = useParams();
  const [open, setOpen] = useState(false);
  const [showEndRoomModal, setShowEndRoomModal] = useState(false);
  const isConnected = useHMSStore(selectIsConnectedToRoom);
  const permissions = useHMSStore(selectPermissions);
  const hmsActions = useHMSActions();
  const { showLeave, onLeave } = useHMSPrebuiltContext();
  useDropdownList({ open, name: 'LeaveRoom' });

  const redirectToLeavePage = () => {
    if (showLeave) {
      if (params.role) {
        navigate('/leave/' + params.roomId + '/' + params.role);
      } else {
        navigate('/leave/' + params.roomId);
      }
    }
    ToastManager.clearAllToast();
    onLeave?.();
  };

  const leaveRoom = () => {
    hmsActions.leave();
    redirectToLeavePage();
  };

  const endRoom = () => {
    hmsActions.endRoom(false, 'End Room');
    redirectToLeavePage();
  };

  if (!permissions || !isConnected) {
    return null;
  }

  return (
    <Fragment>
      {permissions.endRoom ? (
        <Flex>
          <LeaveIconButton
            variant="danger"
            key="LeaveRoom"
            data-testid="leave_room_btn"
            css={{
              borderTopRightRadius: 0,
              borderBottomRightRadius: 0,
              '@md': { borderTopRightRadius: '$1', borderBottomRightRadius: '$1' },
            }}
            onClick={leaveRoom}
          >
            <Tooltip title="Leave Room">
              {!showStreamingUI ? (
                <Box>
                  <HangUpIcon key="hangUp" />
                </Box>
              ) : (
                <Flex gap={2}>
                  <Box>
                    <ExitIcon key="hangUp" />
                  </Box>
                  <Text css={{ '@md': { display: 'none' }, color: 'inherit' }} variant="button">
                    Leave Studio
                  </Text>
                </Flex>
              )}
            </Tooltip>
          </LeaveIconButton>
          <Dropdown.Root open={open} onOpenChange={setOpen}>
            <Dropdown.Trigger
              asChild
              css={{
                '&[data-state="open"]': {
                  bg: '$alert_error_dim',
                },
              }}
            >
              <MenuTriggerButton variant="danger" data-testid="leave_end_dropdown_trigger">
                <VerticalMenuIcon />
              </MenuTriggerButton>
            </Dropdown.Trigger>
            <Dropdown.Content css={{ p: 0, w: '$100' }} alignOffset={-50} sideOffset={10}>
              <Dropdown.Item css={{ bg: '$surface_default' }} onClick={leaveRoom} data-testid="just_leave_btn">
                <Flex gap={4}>
                  <Box>
                    <ExitIcon />
                  </Box>
                  <Flex direction="column" align="start">
                    <Text variant="lg" css={{ color: '$on_surface_high' }}>
                      Leave {showStreamingUI ? 'Studio' : 'Session'}
                    </Text>
                    <Text css={{ c: '$on_surface_low', mt: '$2' }}>
                      Others will continue after you leave. You can join the {showStreamingUI ? 'studio ' : 'room '}
                      again.
                    </Text>
                  </Flex>
                </Flex>
              </Dropdown.Item>
              <Dropdown.Item
                css={{ w: '100%', bg: 'rgba(178, 71, 81, 0.1)' }}
                onClick={() => {
                  setShowEndRoomModal(true);
                }}
                data-testid="end_room_btn"
              >
                <Flex gap={4}>
                  <Box css={{ color: '$alert_error_default' }}>
                    <StopIcon />
                  </Box>
                  <Flex direction="column" align="start">
                    <Text variant="lg" css={{ c: '$alert_error_brighter' }}>
                      End Session
                    </Text>
                    <Text css={{ c: '$alert_error_bright', mt: '$2' }}>
                      The session will end for everyone. You can't undo this action.
                    </Text>
                  </Flex>
                </Flex>
              </Dropdown.Item>
            </Dropdown.Content>
          </Dropdown.Root>
        </Flex>
      ) : (
        <LeaveIconButton onClick={leaveRoom} variant="danger" key="LeaveRoom" data-testid="leave_room_btn">
          <Tooltip title="Leave Room">
            <Box>
              {showStreamingUI ? (
                <Box>
                  <ExitIcon />
                </Box>
              ) : (
                <HangUpIcon key="hangUp" />
              )}
            </Box>
          </Tooltip>
        </LeaveIconButton>
      )}

      <Dialog.Root open={showEndRoomModal}>
        <Dialog.Portal>
          <Dialog.Overlay />
          <Dialog.Content css={{ w: 'min(420px, 90%)', p: '$8', bg: '$surface_dim' }}>
            <Dialog.Title
              css={{
                color: '$alert_error_default',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <AlertTriangleIcon style={{ marginRight: '0.5rem' }} />
              End Session
            </Dialog.Title>
            <Text variant="sm" css={{ color: '$on_surface_medium', mb: '$8', mt: '$4' }}>
              The session will end for everyone and all the activities will stop. You can't undo this action.
            </Text>
            <Flex align="center" justify="between" css={{ w: '100%', gap: '$8' }}>
              <Button outlined variant="standard" css={{ w: '100%' }} onClick={() => setShowEndRoomModal(false)}>
                Cancel
              </Button>
              <Button variant="danger" css={{ w: '100%' }} onClick={endRoom} id="lockRoom" data-testid="lock_end_room">
                End Session
              </Button>
            </Flex>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </Fragment>
  );
};

const LeaveIconButton = styled(IconButton, {
  color: '$on_primary_high',
  h: '$14',
  px: '$6',
  r: '$1',
  bg: '$alert_error_default',
  '&:not([disabled]):hover': {
    bg: '$alert_error_default',
  },
  '&:not([disabled]):active': {
    bg: '$alert_error_default',
  },
  '@md': {
    px: '$4',
    mx: 0,
  },
});

const MenuTriggerButton = styled(LeaveIconButton, {
  borderLeft: '1px solid $alert_error_dim',
  borderTopLeftRadius: 0,
  borderBottomLeftRadius: 0,
  px: '$3',
  '@md': {
    display: 'none',
  },
});
