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
  stopStream,
  screenType,
}: {
  leaveRoom: () => void;
  stopStream: () => Promise<void>;
  screenType: keyof ConferencingScreen;
}) => {
  const [open, setOpen] = useState(false);
  const [showLeaveRoomAlert, setShowLeaveRoomAlert] = useState(false);
  const [showEndStreamAlert, setShowEndStreamAlert] = useState(false);
  const isConnected = useHMSStore(selectIsConnectedToRoom);
  const permissions = useHMSStore(selectPermissions);
  const { isStreamingOn } = useRecordingStreaming();
  const showStream = permissions?.hlsStreaming && isStreamingOn;

  useDropdownList({ open: open || showEndStreamAlert || showLeaveRoomAlert, name: 'LeaveRoom' });

  if (!permissions || !isConnected) {
    return null;
  }

  return (
    <Fragment>
      {permissions.hlsStreaming ? (
        <Flex>
          <LeaveIconButton
            key="LeaveRoom"
            data-testid="leave_room_btn"
            css={{
              borderTopRightRadius: 0,
              borderBottomRightRadius: 0,
            }}
            onClick={() => {
              if (screenType === 'hls_live_streaming') {
                setShowLeaveRoomAlert(true);
              } else {
                leaveRoom();
              }
            }}
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
                  bg: '$alert_error_dim',
                },
              }}
            >
              <MenuTriggerButton data-testid="leave_end_dropdown_trigger">
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
                  icon={<ExitIcon height={24} width={24} style={{ transform: 'rotate(180deg)' }} />}
                  onClick={leaveRoom}
                  css={{ p: 0 }}
                />
              </Dropdown.Item>
              {isStreamingOn && permissions?.hlsStreaming ? (
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
                      setShowEndStreamAlert(true);
                    }}
                    css={{ p: 0 }}
                  />
                </Dropdown.Item>
              ) : null}
            </Dropdown.Content>
          </Dropdown.Root>
        </Flex>
      ) : (
        <LeaveIconButton
          onClick={() => {
            if (screenType === 'hls_live_streaming') {
              setShowLeaveRoomAlert(true);
            } else {
              leaveRoom();
            }
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
          <Dialog.Content css={{ w: 'min(420px, 90%)', p: '$8', bg: '$surface_dim' }}>
            <EndSessionContent
              setShowEndStreamAlert={setShowEndStreamAlert}
              stopStream={stopStream}
              leaveRoom={leaveRoom}
              isStreamingOn={isStreamingOn}
              isModal
            />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {screenType === 'hls_live_streaming' ? (
        <Dialog.Root open={showLeaveRoomAlert} modal={false}>
          <Dialog.Portal>
            <Dialog.Overlay />
            <Dialog.Content css={{ w: 'min(420px, 90%)', p: '$8', bg: '$surface_dim' }}>
              <LeaveSessionContent setShowLeaveRoomAlert={setShowLeaveRoomAlert} leaveRoom={leaveRoom} isModal />
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      ) : null}
    </Fragment>
  );
};
