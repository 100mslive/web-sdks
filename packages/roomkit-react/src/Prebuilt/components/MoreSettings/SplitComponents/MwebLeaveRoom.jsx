import React, { Fragment, useState } from 'react';
import { selectIsConnectedToRoom, selectPermissions, useHMSStore, useRecordingStreaming } from '@100mslive/react-sdk';
import { ExitIcon, StopIcon } from '@100mslive/react-icons';
import { Box } from '../../../../Layout';
import { Sheet } from '../../../../Sheet';
import { Tooltip } from '../../../../Tooltip';
import { EndSessionContent } from '../../EndSessionContent';
import { LeaveCard } from '../../LeaveCard';
import { useDropdownList } from '../../hooks/useDropdownList';
import { useShowStreamingUI } from '../../../common/hooks';

export const MwebLeaveRoom = ({ leaveIconButton: LeaveIconButton, leaveRoom, stopStream }) => {
  const [open, setOpen] = useState(false);
  const [showEndStreamAlert, setShowEndStreamAlert] = useState(false);
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
      {permissions?.hlsStreaming ? (
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
                <Box>
                  <ExitIcon style={{ transform: 'rotate(180deg)' }} />
                </Box>
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
            {isStreamingOn && permissions?.hlsStreaming ? (
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
                  setShowEndStreamAlert(true);
                }}
              />
            ) : null}
          </Sheet.Content>
        </Sheet.Root>
      ) : (
        <LeaveIconButton variant="danger" key="LeaveRoom" data-testid="leave_room_btn" onClick={leaveRoom}>
          <Tooltip title="Leave Room">
            <Box>
              <ExitIcon style={{ transform: 'rotate(180deg)' }} />
            </Box>
          </Tooltip>
        </LeaveIconButton>
      )}
      <Sheet.Root open={showEndStreamAlert} onOpenChange={setShowEndStreamAlert}>
        <Sheet.Content css={{ bg: '$surface_dim', p: '$10', pb: '$12' }}>
          <EndSessionContent
            setShowEndStreamAlert={setShowEndStreamAlert}
            stopStream={stopStream}
            leaveRoom={leaveRoom}
          />
        </Sheet.Content>
      </Sheet.Root>
    </Fragment>
  );
};
