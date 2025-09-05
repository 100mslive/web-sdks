import React, { Fragment, useState } from 'react';
import { ConferencingScreen } from '@100mslive/types-prebuilt';
import { selectIsConnectedToRoom, selectPermissions, useHMSStore, useRecordingStreaming } from '@100mslive/react-sdk';
import { ExitIcon, StopIcon, VerticalMenuIcon } from '@100mslive/react-icons';
import { Dropdown } from '../../../Dropdown';
import { Box, Flex } from '../../../Layout';
import { Dialog } from '../../../Modal';
import { Tooltip } from '../../../Tooltip';
import { EndSessionContent } from './EndSessionContent';
import { LeaveIconButton, MenuTriggerButton } from './LeaveAtoms';
import { LeaveCard } from './LeaveCard';
import { LeaveSessionContent } from './LeaveSessionContent';
// @ts-ignore: No implicit Any
import { useDropdownList } from '../hooks/useDropdownList';

export const DesktopLeaveRoom = ({
  leaveRoom,
  screenType,
  endRoom,
  container,
}: {
  leaveRoom: (options?: { endStream?: boolean; sendReason?: boolean }) => Promise<void>;
  screenType: keyof ConferencingScreen;
  endRoom: () => Promise<void>;
  container?: HTMLElement;
}) => {
  const [open, setOpen] = useState(false);
  const [showLeaveRoomAlert, setShowLeaveRoomAlert] = useState(false);
  const [showEndStreamAlert, setShowEndStreamAlert] = useState(false);
  const isConnected = useHMSStore(selectIsConnectedToRoom);
  const permissions = useHMSStore(selectPermissions);
  const { isStreamingOn } = useRecordingStreaming();
  const showStream = screenType !== 'hls_live_streaming' && isStreamingOn && permissions?.hlsStreaming;
  const showLeaveOptions = (permissions?.hlsStreaming && isStreamingOn) || permissions?.endRoom;

  useDropdownList({ open: open || showEndStreamAlert || showLeaveRoomAlert, name: 'LeaveRoom' });

  if (!permissions || !isConnected) {
    return null;
  }

  return (
    <Fragment>
      {showLeaveOptions ? (
        <Flex>
          <LeaveIconButton
            key="LeaveRoom"
            data-testid="leave_room_btn"
            css={{
              borderTopRightRadius: 0,
              borderBottomRightRadius: 0,
            }}
            onClick={() => setShowLeaveRoomAlert(true)}
          >
            <Tooltip title="Leave Room">
              <Box>
                <ExitIcon style={{ transform: 'rotate(180deg)' }} />
              </Box>
            </Tooltip>
          </LeaveIconButton>
          <Dropdown.Root open={open} onOpenChange={setOpen} modal={false}>
            <Dropdown.Trigger
              asChild
              css={{
                '&[data-state="open"]': {
                  bg: 'alert.error.dim',
                },
              }}
            >
              <MenuTriggerButton data-testid="leave_end_dropdown_trigger">
                <VerticalMenuIcon />
              </MenuTriggerButton>
            </Dropdown.Trigger>
            <Dropdown.Portal container={container}>
              <Dropdown.Content css={{ p: 0, w: '100' }} alignOffset={-50} sideOffset={10}>
                <Dropdown.Item
                  css={{
                    bg: 'surface.dim',
                    color: 'onSurface.medium',
                    '&:hover': { bg: 'surface.default', color: 'onSurface.high' },
                    p: '0',
                  }}
                  data-testid="just_leave_btn"
                >
                  <LeaveCard
                    title={showStream ? 'Leave Stream' : 'Leave Session'}
                    subtitle={`Others will continue after you leave. You can join the ${
                      showStream ? 'stream' : 'session'
                    } again.`}
                    bg=""
                    titleColor="$on_surface_high"
                    icon={<ExitIcon height={24} width={24} style={{ transform: 'rotate(180deg)' }} />}
                    onClick={async () => await leaveRoom({ sendReason: true })}
                    css={{ p: '$8 $4' }}
                  />
                </Dropdown.Item>

                <Dropdown.Item
                  css={{
                    bg: 'alert.error.dim',
                    color: 'alert.error.bright',
                    '&:hover': { bg: 'alert.error.dim', color: 'alert.error.brighter' },
                    p: '0',
                  }}
                  data-testid="end_room_btn"
                >
                  <LeaveCard
                    title={showStream ? 'End Stream' : 'End Session'}
                    subtitle={`The ${
                      showStream ? 'stream' : 'session'
                    } will end for everyone. You can't undo this action.`}
                    bg=""
                    titleColor="$alert_error_brighter"
                    icon={<StopIcon height={24} width={24} />}
                    onClick={() => {
                      setOpen(false);
                      setShowEndStreamAlert(true);
                    }}
                    css={{ p: '$8 $4' }}
                  />
                </Dropdown.Item>
              </Dropdown.Content>
            </Dropdown.Portal>
          </Dropdown.Root>
        </Flex>
      ) : (
        <LeaveIconButton
          onClick={() => {
            setShowLeaveRoomAlert(true);
          }}
          key="LeaveRoom"
          data-testid="leave_room_btn"
        >
          <Tooltip title="Leave Room">
            <Box>
              <ExitIcon style={{ transform: 'rotate(180deg)' }} />
            </Box>
          </Tooltip>
        </LeaveIconButton>
      )}

      <Dialog.Root open={showEndStreamAlert} modal={false}>
        <Dialog.Portal>
          <Dialog.Overlay />
          <Dialog.Content css={{ w: 'min(420px, 90%)', p: '8', bg: 'surface.dim' }}>
            <EndSessionContent
              setShowEndStreamAlert={setShowEndStreamAlert}
              leaveRoom={isStreamingOn ? () => leaveRoom({ endStream: true }) : endRoom}
              isStreamingOn={isStreamingOn}
              isModal
            />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root open={showLeaveRoomAlert} modal={false}>
        <Dialog.Portal>
          <Dialog.Overlay />
          <Dialog.Content css={{ w: 'min(420px, 90%)', p: '8', bg: 'surface.dim' }}>
            <LeaveSessionContent setShowLeaveRoomAlert={setShowLeaveRoomAlert} leaveRoom={leaveRoom} isModal />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </Fragment>
  );
};
