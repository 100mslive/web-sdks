import React from 'react';
import {
  DeviceType,
  getAudioDeviceCategory,
  HMSAudioDeviceCategory,
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
  TelePhoneIcon,
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

// It will handle and show audio input devices in Mweb while audio output devices in desktop
export const AudioActions = () => {
  const { allDevices, selectedDeviceIDs, updateDevice } = useDevices();

  // don't show speaker selector where the API is not supported, and use
  // a generic word("Audio") for Mic. In some cases(Chrome Android for example) this changes both mic and speaker keeping them in sync.
  const shouldShowAudioOutput = 'setSinkId' in HTMLMediaElement.prototype;
  const { audioInput, audioOutput } = allDevices;
  let availableAudioDevices = audioInput;
  let selectedAudio = selectedDeviceIDs.audioInput;
  if (shouldShowAudioOutput) {
    availableAudioDevices = audioOutput;
    selectedAudio = selectedDeviceIDs.audioOutput;
  }
  const hmsActions = useHMSActions();
  const audioFiltered = availableAudioDevices?.find(item => !!item.label);
  const currentSelection = availableAudioDevices?.find(item => item.deviceId === selectedAudio);

  if (!audioFiltered) {
    return null;
  }
  const deviceCategory = getAudioDeviceCategory(currentSelection?.label);
  let AudioIcon = <SpeakerIcon />;
  if (deviceCategory === HMSAudioDeviceCategory.BLUETOOTH) {
    AudioIcon = <BluetoothIcon />;
  } else if (deviceCategory === HMSAudioDeviceCategory.WIRED) {
    AudioIcon = <HeadphonesIcon />;
  } else if (deviceCategory === HMSAudioDeviceCategory.EARPIECE) {
    AudioIcon = <TelePhoneIcon />;
  }
  return (
    <AudioSelectionSheet
      audioDevices={availableAudioDevices}
      audioSelected={selectedAudio}
      onChange={async deviceId => {
        try {
          await updateDevice({
            deviceId,
            deviceType: shouldShowAudioOutput ? DeviceType.audioOutput : DeviceType.audioInput,
          });
        } catch (e) {
          ToastManager.addToast({
            title: `Error while changing audio device ${e.message || ''}`,
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
        <IconButton>{AudioIcon}</IconButton>
      </Box>
    </AudioSelectionSheet>
  );
};

const AudioSelectionSheet = ({ audioDevices, audioSelected, onChange, children }) => {
  return (
    <Sheet.Root>
      <Sheet.Trigger asChild>{children}</Sheet.Trigger>
      <Sheet.Content>
        <Sheet.Title css={{ py: '10', px: '8', alignItems: 'center' }}>
          <Flex direction="row" justify="between" css={{ w: '100%' }}>
            <Text variant="h6" css={{ display: 'flex' }}>
              Audio
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
            px: '8',
            maxHeight: '80vh',
            overflowY: 'auto',
          }}
        >
          {audioDevices.map(audioDevice => {
            return (
              <SelectWithLabel
                key={audioDevice.deviceId}
                label={audioDevice.label}
                id={audioDevice.deviceId}
                checked={audioDevice.deviceId === audioSelected}
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
        my: '2',
        py: '8',
        w: '100%',
        borderBottom: '1px solid $border_default',
      }}
      onClick={onChange}
    >
      <Label
        htmlFor={id}
        css={{
          fontSize: 'md',
          fontWeight: '$semiBold',
          color: 'onSurface.high',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8',
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
