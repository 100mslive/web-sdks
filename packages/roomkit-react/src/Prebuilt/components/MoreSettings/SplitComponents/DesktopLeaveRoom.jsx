import React, { Fragment, useState } from 'react';
import { selectIsConnectedToRoom, selectPermissions, useHMSStore, useRecordingStreaming } from '@100mslive/react-sdk';
import { ExitIcon, HangUpIcon, StopIcon, VerticalMenuIcon } from '@100mslive/react-icons';
import { Dropdown } from '../../../../Dropdown';
import { Box, Flex } from '../../../../Layout';
import { Dialog } from '../../../../Modal';
import { Tooltip } from '../../../../Tooltip';
import { EndSessionContent } from '../../EndSessionContent';
import { LeaveCard } from '../../LeaveCard';
import { useDropdownList } from '../../hooks/useDropdownList';
import { useShowStreamingUI } from '../../../common/hooks';

export const DesktopLeaveRoom = ({
  menuTriggerButton: MenuTriggerButton,
  leaveIconButton: LeaveIconButton,
  leaveRoom,
  endRoom,
}) => {
  const [open, setOpen] = useState(false);
  const [showEndRoomAlert, setShowEndRoomAlert] = useState(false);
  const isConnected = useHMSStore(selectIsConnectedToRoom);
  const permissions = useHMSStore(selectPermissions);
  const { isStreamingOn } = useRecordingStreaming();

  const showStreamingUI = useShowStreamingUI();

  const showStream = showStreamingUI && isStreamingOn;

  useDropdownList({ open, name: 'LeaveRoom' });

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
            }}
            onClick={leaveRoom}
          >
            <Tooltip title="Leave Room">
              <Box>{showStreamingUI ? <ExitIcon /> : <HangUpIcon key="hangUp" />}</Box>
            </Tooltip>
          </LeaveIconButton>
          <Dropdown.Root open={open} onOpenChange={setOpen} modal={false}>
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
                  title={showStream ? 'Leave Stream' : 'Leave Session'}
                  subtitle={`Others will continue after you leave. You can join the ${
                    showStream ? 'stream' : 'session'
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
                  title={showStream ? 'End Stream' : 'End Session'}
                  subtitle={`The ${
                    showStream ? 'stream' : 'session'
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
            <Box>{showStream ? <ExitIcon /> : <HangUpIcon key="hangUp" />}</Box>
          </Tooltip>
        </LeaveIconButton>
      )}

      <Dialog.Root open={showEndRoomAlert} modal={false}>
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
