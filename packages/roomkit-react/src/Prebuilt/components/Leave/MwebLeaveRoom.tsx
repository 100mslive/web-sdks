import { Fragment, useState } from 'react';
// @ts-ignore: No implicit Any
import { selectIsConnectedToRoom, selectPermissions, useHMSStore, useRecordingStreaming } from '@100mslive/react-sdk';
// @ts-ignore: No implicit Any
import { CrossIcon, ExitIcon, StopIcon } from '@100mslive/react-icons';
import { IconButton } from '../../../IconButton';
import { Box } from '../../../Layout';
import { Sheet } from '../../../Sheet';
import { Tooltip } from '../../../Tooltip';
import { EndSessionContent } from './EndSessionContent';
import { LeaveIconButton } from './LeaveAtoms';
import { LeaveCard } from './LeaveCard';
import { LeaveSessionContent } from './LeaveSessionContent';
import { useRoomLayoutConferencingScreen } from '../../provider/roomLayoutProvider/hooks/useRoomLayoutScreen';
// @ts-ignore: No implicit Any
import { useDropdownList } from '../hooks/useDropdownList';
import { useLandscapeHLSStream, useMobileHLSStream } from '../../common/hooks';

export const MwebLeaveRoom = ({
  leaveRoom,
  endRoom,
  container,
}: {
  leaveRoom: (options?: { endStream?: boolean; sendReason?: boolean }) => Promise<void>;
  endRoom: () => Promise<void>;
  container?: HTMLElement;
}) => {
  const [open, setOpen] = useState(false);
  const { screenType } = useRoomLayoutConferencingScreen();
  const [showLeaveRoomAlert, setShowLeaveRoomAlert] = useState(false);
  const [showEndStreamAlert, setShowEndStreamAlert] = useState(false);
  const isConnected = useHMSStore(selectIsConnectedToRoom);
  const permissions = useHMSStore(selectPermissions);
  const { isStreamingOn } = useRecordingStreaming();
  const showStream = screenType !== 'hls_live_streaming' && isStreamingOn && permissions?.hlsStreaming;
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
            <LeaveButton
              onClick={() => {
                setOpen(open => !open);
              }}
            />
          </Sheet.Trigger>
          <Sheet.Content container={container}>
            <LeaveCard
              title={showStream ? 'Leave Stream' : 'Leave Session'}
              subtitle={`Others will continue after you leave. You can join the ${
                showStream ? 'stream' : 'session'
              } again.`}
              bg="$surface_default"
              titleColor="$on_surface_high"
              icon={<ExitIcon height={24} width={24} style={{ transform: 'rotate(180deg)' }} />}
              onClick={async () => await leaveRoom({ sendReason: true })}
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
        <LeaveButton onClick={() => setShowLeaveRoomAlert(true)} />
      )}
      <Sheet.Root open={showEndStreamAlert} onOpenChange={setShowEndStreamAlert}>
        <Sheet.Content css={{ bg: '$surface_dim', p: '$10', pb: '$12' }} container={container}>
          <EndSessionContent
            setShowEndStreamAlert={setShowEndStreamAlert}
            leaveRoom={isStreamingOn ? leaveRoom : endRoom}
            isStreamingOn={isStreamingOn}
          />
        </Sheet.Content>
      </Sheet.Root>

      <Sheet.Root open={showLeaveRoomAlert} onOpenChange={setShowLeaveRoomAlert}>
        <Sheet.Content css={{ bg: '$surface_dim', p: '$10', pb: '$12' }} container={container}>
          <LeaveSessionContent setShowLeaveRoomAlert={setShowLeaveRoomAlert} leaveRoom={leaveRoom} />
        </Sheet.Content>
      </Sheet.Root>
    </Fragment>
  );
};

const LeaveButton = ({ onClick }: { onClick: () => void }) => {
  const isMobileHLSStream = useMobileHLSStream();
  const isLandscapeHLSStream = useLandscapeHLSStream();

  return isMobileHLSStream || isLandscapeHLSStream ? (
    <IconButton key="LeaveRoom" data-testid="leave_room_btn" onClick={onClick}>
      <Tooltip title="Leave Room">
        <Box>
          <CrossIcon />
        </Box>
      </Tooltip>
    </IconButton>
  ) : (
    <LeaveIconButton
      key="LeaveRoom"
      data-testid="leave_room_btn"
      css={{
        borderTopRightRadius: '$1',
        borderBottomRightRadius: '$1',
      }}
      onClick={onClick}
    >
      <Tooltip title="Leave Room">
        <Box>
          <ExitIcon style={{ transform: 'rotate(180deg)' }} />
        </Box>
      </Tooltip>
    </LeaveIconButton>
  );
};
