import React from 'react';
import {
  DeviceType,
  selectIsLocalVideoEnabled,
  selectLocalVideoTrackID,
  selectVideoTrackByID,
  useDevices,
  useHMSActions,
  useHMSStore,
} from '@100mslive/react-sdk';
import {
  BluetoothIcon,
  CameraFlipIcon,
  CheckIcon,
  CrossIcon,
  HeadphonesIcon,
  SpeakerIcon,
} from '@100mslive/react-icons';
import { HorizontalDivider } from '../../../Divider';
import { Label } from '../../../Label';
import { Box, Flex } from '../../../Layout';
import { Sheet } from '../../../Sheet';
import { Text } from '../../../Text';
import IconButton from '../../IconButton';
import { ToastManager } from '../Toast/ToastManager';

export const CamaraFlipActions = () => {
  const actions = useHMSActions();
  const { allDevices } = useDevices();
  const { videoInput } = allDevices;
  const isVideoOn = useHMSStore(selectIsLocalVideoEnabled);

  const videoTrackId = useHMSStore(selectLocalVideoTrackID);
  const localVideoTrack = useHMSStore(selectVideoTrackByID(videoTrackId));
  if (!videoInput || !videoInput?.length || !localVideoTrack?.facingMode) {
    return null;
  }
  return (
    <Box>
      <IconButton
        disabled={!isVideoOn}
        onClick={async () => {
          try {
            await actions.switchCamera();
          } catch (e) {
            ToastManager.addToast({
              title: `Error while flipping camera ${e.message || ''}`,
              variant: 'error',
            });
          }
        }}
      >
        <CameraFlipIcon />
      </IconButton>
    </Box>
  );
};

export const AudioOutputActions = () => {
  const { allDevices, selectedDeviceIDs, updateDevice } = useDevices();
  const { audioInput } = allDevices;
  const hmsActions = useHMSActions();

  /**
   * Chromium browsers return an audioInput with empty label when no permissions are given
   */
  const audioInputFiltered = audioInput?.filter(item => !!item.label) ?? [];
  const audioInputLabel = audioInput?.filter(item => item.deviceId === selectedDeviceIDs.audioInput)?.[0];

  if (!(audioInputFiltered?.length > 0)) {
    return null;
  }
  let AudioInputIcon = <SpeakerIcon />;
  if (audioInputLabel && audioInputLabel.label.toLowerCase().includes('bluetooth')) {
    AudioInputIcon = <BluetoothIcon />;
  } else if (audioInputLabel && audioInputLabel.label.toLowerCase().includes('wired')) {
    AudioInputIcon = <HeadphonesIcon />;
  }
  return (
    <AudioOutputSelectionSheet
      outputDevices={audioInput}
      outputSelected={selectedDeviceIDs.audioInput}
      onChange={async deviceId => {
        try {
          await updateDevice({
            deviceId,
            deviceType: DeviceType.audioInput,
          });
        } catch (e) {
          ToastManager.addToast({
            title: `Error while changing audio input ${e.message || ''}`,
            variant: 'error',
          });
        }
      }}
    >
      <Box
        onClick={async () => {
          // refresh device as `devicechange` listener won't work in mobile device
          await hmsActions.refreshDevices();
        }}
      >
        <IconButton>{AudioInputIcon} </IconButton>
      </Box>
    </AudioOutputSelectionSheet>
  );
};

const AudioOutputSelectionSheet = ({ outputDevices, outputSelected, onChange, children }) => {
  return (
    <Sheet.Root>
      <Sheet.Trigger asChild>{children}</Sheet.Trigger>
      <Sheet.Content>
        <Sheet.Title css={{ py: '$10', px: '$8', alignItems: 'center' }}>
          <Flex direction="row" justify="between" css={{ w: '100%' }}>
            <Text variant="h6" css={{ display: 'flex' }}>
              Audio Input
            </Text>
            <Sheet.Close>
              <IconButton as="div" data-testid="dialog_cross_icon">
                <CrossIcon />
              </IconButton>
            </Sheet.Close>
          </Flex>
        </Sheet.Title>
        <HorizontalDivider />
        <Flex
          direction="column"
          css={{
            px: '$8',
            maxHeight: '80vh',
            overflowY: 'scroll',
          }}
        >
          {outputDevices.map(audioDevice => {
            return (
              <SelectWithLabel
                key={audioDevice.deviceId}
                label={audioDevice.label}
                id={audioDevice.deviceId}
                checked={audioDevice.deviceId === outputSelected}
                onChange={() => onChange(audioDevice.deviceId)}
              />
            );
          })}
        </Flex>
      </Sheet.Content>
    </Sheet.Root>
  );
};

const SelectWithLabel = ({ label, icon = <></>, checked, id, onChange }) => {
  return (
    <Flex
      align="center"
      css={{
        my: '$2',
        py: '$8',
        w: '100%',
        borderBottom: '1px solid $border_default',
      }}
      onClick={onChange}
    >
      <Label
        htmlFor={id}
        css={{
          fontSize: '$md',
          fontWeight: '$semiBold',
          color: checked ? '$on_surface_high' : '$on_surface_low',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '$8',
          flex: '1 1 0',
        }}
      >
        {icon}
        {label}
      </Label>
      {checked && <CheckIcon width={24} height={24} />}
    </Flex>
  );
};
