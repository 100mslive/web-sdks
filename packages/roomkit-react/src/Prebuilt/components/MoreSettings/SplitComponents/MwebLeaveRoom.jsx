import React, { Fragment, useState } from 'react';
import {
  selectIsConnectedToRoom,
  selectLocalPeerRoleName,
  selectPermissions,
  useHMSStore,
  useRecordingStreaming,
} from '@100mslive/react-sdk';
import { ExitIcon, StopIcon } from '@100mslive/react-icons';
import { Box } from '../../../../Layout';
import { Sheet } from '../../../../Sheet';
import { Tooltip } from '../../../../Tooltip';
import { EndSessionContent } from '../../EndSessionContent';
import { LeaveCard } from '../../LeaveCard';
import { LeaveSessionContent } from '../../LeaveSessionContent';
import { useHLSViewerRole } from '../../AppData/useUISettings';
import { useDropdownList } from '../../hooks/useDropdownList';
import { useShowStreamingUI } from '../../../common/hooks';

export const MwebLeaveRoom = ({ leaveIconButton: LeaveIconButton, endRoom, leaveRoom }) => {
  const [open, setOpen] = useState(false);
  const [showEndRoomAlert, setShowEndRoomAlert] = useState(false);
  const [showLeaveRoomAlert, setShowLeaveRoomAlert] = useState(false);
  const isConnected = useHMSStore(selectIsConnectedToRoom);
  const permissions = useHMSStore(selectPermissions);
  const { isStreamingOn } = useRecordingStreaming();
  const localPeerRoleName = useHMSStore(selectLocalPeerRoleName);
  const hlsViewerRole = useHLSViewerRole();
  const isHLSViewer = hlsViewerRole === localPeerRoleName;
  const showStreamingUI = useShowStreamingUI();

  const showStream = showStreamingUI && isStreamingOn;
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
              onClick={() => {
                if (isHLSViewer) {
                  setShowLeaveRoomAlert(true);
                }
              }}
              variant="danger"
              key="LeaveRoom"
              data-testid="leave_room_btn"
              css={{
                borderTopRightRadius: '$1',
                borderBottomRightRadius: '$1',
              }}
            >
              <Tooltip title="Leave Room">
                <ExitIcon style={{ transform: 'rotate(180deg)' }} />
              </Tooltip>
            </LeaveIconButton>
          </Sheet.Trigger>
          <Sheet.Content>
            <LeaveCard
              title={showStream ? 'Leave Stream' : 'Leave Session'}
              subtitle={`Others will continue after you leave. You can join the ${
                showStream ? 'stream' : 'session'
              } again.`}
              bg="$surface_default"
              titleColor="$on_surface_high"
              subtitleColor="$on_surface_low"
              icon={<ExitIcon height={24} width={24} style={{ transform: 'rotate(180deg)' }} />}
              onClick={leaveRoom}
              css={{ pt: 0, mt: '$10' }}
            />
            <LeaveCard
              title={showStream ? 'End Stream' : 'End Session'}
              subtitle={`The will end the ${
                showStream ? 'stream' : 'session'
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
        <LeaveIconButton
          variant="danger"
          key="LeaveRoom"
          data-testid="leave_room_btn"
          onClick={() => {
            if (isHLSViewer) {
              setShowLeaveRoomAlert(true);
            }
          }}
        >
          <Tooltip title="Leave Room">
            <Box>
              <ExitIcon style={{ transform: 'rotate(180deg)' }} />
            </Box>
          </Tooltip>
        </LeaveIconButton>
      )}
      <Sheet.Root open={showEndRoomAlert} onOpenChange={setShowEndRoomAlert}>
        <Sheet.Content css={{ bg: '$surface_dim', p: '$10', pb: '$12' }}>
          <EndSessionContent setShowEndRoomAlert={setShowEndRoomAlert} endRoom={endRoom} />
        </Sheet.Content>
      </Sheet.Root>

      {isHLSViewer ? (
        <Sheet.Root open={showLeaveRoomAlert} onOpenChange={setShowLeaveRoomAlert}>
          <Sheet.Content css={{ bg: '$surface_dim', p: '$10', pb: '$12' }}>
            <LeaveSessionContent setShowLeaveRoomAlert={setShowLeaveRoomAlert} leaveRoom={leaveRoom} />
          </Sheet.Content>
        </Sheet.Root>
      ) : null}
    </Fragment>
  );
};
