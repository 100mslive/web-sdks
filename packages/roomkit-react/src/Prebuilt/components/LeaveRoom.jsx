import React, { Fragment, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMedia } from 'react-use';
import { selectIsConnectedToRoom, selectPermissions, useHMSActions, useHMSStore } from '@100mslive/react-sdk';
import { ExitIcon, HangUpIcon, StopIcon, VerticalMenuIcon } from '@100mslive/react-icons';
import { ToastManager } from './Toast/ToastManager';
import { Dropdown } from '../../Dropdown';
import { IconButton } from '../../IconButton';
import { Box, Flex } from '../../Layout';
import { Dialog } from '../../Modal';
import { Sheet } from '../../Sheet';
import { Text } from '../../Text';
import { config as cssConfig, styled } from '../../Theme';
import { Tooltip } from '../../Tooltip';
import { useHMSPrebuiltContext } from '../AppContext';
import { EndSessionContent } from './EndSessionContent';
import { LeaveCard } from './LeaveCard';
import { useDropdownList } from './hooks/useDropdownList';
import { useNavigation } from './hooks/useNavigation';
import { useShowStreamingUI } from '../common/hooks';

export const LeaveRoom = () => {
  const navigate = useNavigation();
  const params = useParams();
  const [open, setOpen] = useState(false);
  const [showEndRoomAlert, setShowEndRoomAlert] = useState(false);
  const isConnected = useHMSStore(selectIsConnectedToRoom);
  const permissions = useHMSStore(selectPermissions);
  const hmsActions = useHMSActions();
  const { showLeave, onLeave } = useHMSPrebuiltContext();
  const isMobile = useMedia(cssConfig.media.md);
  const showStreamingUI = useShowStreamingUI();
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

  if (isMobile) {
    return (
      <Fragment>
        {permissions.endRoom ? (
          <Sheet.Root open={open} onOpenChange={setOpen}>
            <Sheet.Trigger asChild>
              <LeaveIconButton
                variant="danger"
                key="LeaveRoom"
                data-testid="leave_room_btn"
                css={{
                  borderTopRightRadius: '$1',
                  borderBottomRightRadius: '$1',
                }}
              >
                <Tooltip title="Leave Room">
                  {!showStreamingUI ? <HangUpIcon key="hangUp" /> : <ExitIcon key="hangUp" />}
                </Tooltip>
              </LeaveIconButton>
            </Sheet.Trigger>
            <Sheet.Content>
              <LeaveCard
                title={showStreamingUI ? 'Leave Stream' : 'Leave Session'}
                subtitle={`Others will continue after you leave. You can join the ${
                  showStreamingUI ? 'stream' : 'session'
                } again.`}
                bg="$surface_default"
                titleColor="$on_surface_high"
                subtitleColor="$on_surface_low"
                icon={<ExitIcon height={24} width={24} />}
                onClick={leaveRoom}
                css={{ pt: 0, mt: '$10' }}
              />
              <LeaveCard
                title={showStreamingUI ? 'End Stream' : 'End Session'}
                subtitle={`The will end the ${
                  showStreamingUI ? 'stream' : 'session'
                } for everyone. You can't undo this action.`}
                bg="$alert_error_dim"
                titleColor="$alert_error_brighter"
                subtitleColor="$alert_error_bright"
                icon={<StopIcon height={24} width={24} />}
                onClick={() => {
                  setOpen(false);
                  setShowEndRoomAlert(true);
                }}
              />
            </Sheet.Content>
          </Sheet.Root>
        ) : (
          <LeaveIconButton variant="danger" key="LeaveRoom" data-testid="leave_room_btn">
            <Tooltip title="Leave Room">
              <Box>{showStreamingUI ? <ExitIcon /> : <HangUpIcon key="hangUp" />}</Box>
            </Tooltip>
          </LeaveIconButton>
        )}
        <Sheet.Root open={showEndRoomAlert} onOpenChange={setShowEndRoomAlert}>
          <Sheet.Content css={{ bg: '$surface_dim', p: '$10', pb: '$12' }}>
            <EndSessionContent setShowEndRoomAlert={setShowEndRoomAlert} endRoom={endRoom} />
          </Sheet.Content>
        </Sheet.Root>
      </Fragment>
    );
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
              <Box>
                <HangUpIcon key="hangUp" />
              </Box>
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
                <LeaveCard
                  title={showStreamingUI ? 'Leave Stream' : 'Leave Session'}
                  subtitle={`Others will continue after you leave. You can join the ${
                    showStreamingUI ? 'stream' : 'session'
                  } again.`}
                  bg=""
                  titleColor="$on_surface_high"
                  subtitleColor="$on_surface_low"
                  icon={<ExitIcon height={24} width={24} />}
                  onClick={leaveRoom}
                  css={{ p: 0 }}
                />
              </Dropdown.Item>
              <Dropdown.Item css={{ bg: '$alert_error_dim' }} data-testid="end_room_btn">
                <LeaveCard
                  title={showStreamingUI ? 'End Stream' : 'End Session'}
                  subtitle={`The ${
                    showStreamingUI ? 'stream' : 'session'
                  } will end for everyone. You can't undo this action.`}
                  bg=""
                  titleColor="$alert_error_brighter"
                  subtitleColor="$alert_error_bright"
                  icon={<StopIcon height={24} width={24} />}
                  onClick={() => {
                    setOpen(false);
                    setShowEndRoomAlert(true);
                  }}
                  css={{ p: 0 }}
                />
              </Dropdown.Item>
            </Dropdown.Content>
          </Dropdown.Root>
        </Flex>
      ) : (
        <LeaveIconButton onClick={leaveRoom} variant="danger" key="LeaveRoom" data-testid="leave_room_btn">
          <Tooltip title="Leave Room">
            <Box>{showStreamingUI ? <ExitIcon /> : <HangUpIcon key="hangUp" />}</Box>
          </Tooltip>
        </LeaveIconButton>
      )}

      <Dialog.Root open={showEndRoomAlert}>
        <Dialog.Portal>
          <Dialog.Overlay />
          <Dialog.Content css={{ w: 'min(420px, 90%)', p: '$8', bg: '$surface_dim' }}>
            <EndSessionContent setShowEndRoomAlert={setShowEndRoomAlert} endRoom={endRoom} isModal />
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
