import React, { Fragment, useState } from 'react';
import { selectIsConnectedToRoom, selectPermissions, useHMSStore } from '@100mslive/react-sdk';
import { ExitIcon, HangUpIcon, StopIcon } from '@100mslive/react-icons';
import { Box } from '../../../../Layout';
import { Sheet } from '../../../../Sheet';
import { Tooltip } from '../../../../Tooltip';
import { EndSessionContent } from '../../EndSessionContent';
import { LeaveCard } from '../../LeaveCard';
import { useDropdownList } from '../../hooks/useDropdownList';
import { useShowStreamingUI } from '../../../common/hooks';

export const MwebLeaveRoom = ({ leaveIconButton: LeaveIconButton, endRoom, leaveRoom }) => {
  const [open, setOpen] = useState(false);
  const [showEndRoomAlert, setShowEndRoomAlert] = useState(false);
  const isConnected = useHMSStore(selectIsConnectedToRoom);
  const permissions = useHMSStore(selectPermissions);

  const showStreamingUI = useShowStreamingUI();
  useDropdownList({ open, name: 'LeaveRoom' });

  if (!permissions || !isConnected) {
    return null;
  }

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
                <Box>{!showStreamingUI ? <HangUpIcon key="hangUp" /> : <ExitIcon key="hangUp" />}</Box>
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
};
