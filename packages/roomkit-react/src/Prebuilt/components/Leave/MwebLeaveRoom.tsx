import React, { Fragment, useState } from 'react';
import { ConferencingScreen } from '@100mslive/types-prebuilt';
// @ts-ignore: No implicit Any
import { selectIsConnectedToRoom, selectPermissions, useHMSStore, useRecordingStreaming } from '@100mslive/react-sdk';
// @ts-ignore: No implicit Any
import { ExitIcon, StopIcon } from '@100mslive/react-icons';
import { Box } from '../../../Layout';
import { Sheet } from '../../../Sheet';
import { Tooltip } from '../../../Tooltip';
import { EndSessionContent } from './EndSessionContent';
import { LeaveIconButton } from './LeaveAtoms';
import { LeaveCard } from './LeaveCard';
import { LeaveSessionContent } from './LeaveSessionContent';
// @ts-ignore: No implicit Any
import { useDropdownList } from '../hooks/useDropdownList';

export const MwebLeaveRoom = ({
  leaveRoom,
  screenType,
  endRoom,
}: {
  leaveRoom: (options?: { endStream?: boolean }) => Promise<void>;
  screenType: keyof ConferencingScreen;
  endRoom: () => Promise<void>;
}) => {
  const [open, setOpen] = useState(false);
  const [showLeaveRoomAlert, setShowLeaveRoomAlert] = useState(false);
  const [showEndStreamAlert, setShowEndStreamAlert] = useState(false);
  const isConnected = useHMSStore(selectIsConnectedToRoom);
  const permissions = useHMSStore(selectPermissions);
  const { isStreamingOn } = useRecordingStreaming();
  const showStream = screenType !== 'hls_live_streaming' && isStreamingOn;
  const showLeaveOptions = (permissions?.hlsStreaming && isStreamingOn) || permissions?.endRoom;

  useDropdownList({ open, name: 'LeaveRoom' });

  if (!permissions || !isConnected) {
    return null;
  }

  return (
    <Fragment>
      {showLeaveOptions ? (
        <Sheet.Root open={open} onOpenChange={setOpen}>
          <Sheet.Trigger asChild>
            <LeaveIconButton
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
              icon={<ExitIcon height={24} width={24} style={{ transform: 'rotate(180deg)' }} />}
              onClick={async () => await leaveRoom()}
              css={{ pt: 0, mt: '$10', color: '$on_surface_low', '&:hover': { color: '$on_surface_high' } }}
            />

            <LeaveCard
              title={showStream ? 'End Stream' : 'End Session'}
              subtitle={`The will end the ${
                showStream ? 'stream' : 'session'
              } for everyone. You can't undo this action.`}
              bg="$alert_error_dim"
              titleColor="$alert_error_brighter"
              css={{ color: '$alert_error_bright', '&:hover': { color: '$alert_error_brighter' } }}
              icon={<StopIcon height={24} width={24} />}
              onClick={() => {
                setOpen(false);
                setShowEndStreamAlert(true);
              }}
            />
          </Sheet.Content>
        </Sheet.Root>
      ) : (
        <LeaveIconButton key="LeaveRoom" data-testid="leave_room_btn" onClick={() => setShowLeaveRoomAlert(true)}>
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
            leaveRoom={isStreamingOn ? leaveRoom : endRoom}
            isStreamingOn={isStreamingOn}
          />
        </Sheet.Content>
      </Sheet.Root>

      <Sheet.Root open={showLeaveRoomAlert} onOpenChange={setShowLeaveRoomAlert}>
        <Sheet.Content css={{ bg: '$surface_dim', p: '$10', pb: '$12' }}>
          <LeaveSessionContent setShowLeaveRoomAlert={setShowLeaveRoomAlert} leaveRoom={leaveRoom} />
        </Sheet.Content>
      </Sheet.Root>
    </Fragment>
  );
};
