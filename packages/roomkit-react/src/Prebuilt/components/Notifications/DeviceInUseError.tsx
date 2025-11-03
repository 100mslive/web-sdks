import { useEffect, useState } from 'react';
import {
  HMSNotificationTypes,
  HMSTrackException,
  HMSTrackExceptionTrackType,
  useHMSNotifications,
} from '@100mslive/react-sdk';
import { Button, Dialog, Text } from '../../..';
// @ts-ignore: No implicit Any
import { DialogContent, DialogRow } from '../../primitives/DialogContent';
// @ts-ignore: No implicit Any
import { ToastManager } from '../Toast/ToastManager';

const Instruction = ({ description }: { description: string }) => (
  <li>
    <DialogRow css={{ ml: '$4' }}>
      <Text variant="body2">{description}</Text>
    </DialogRow>
  </li>
);

export function DeviceInUseError() {
  const notification = useHMSNotifications(HMSNotificationTypes.ERROR);
  const [showDeviceInUseModal, setShowDeviceInUseModal] = useState(false);
  const [deviceType, setDeviceType] = useState('');

  useEffect(() => {
    const error = notification?.data;
    if (!error || error.code !== 3003) {
      return;
    }
    const errorTrackExceptionType = (error as HMSTrackException)?.trackType;
    const hasAudio = errorTrackExceptionType === HMSTrackExceptionTrackType.AUDIO;
    const hasVideo = errorTrackExceptionType === HMSTrackExceptionTrackType.VIDEO;
    const hasAudioVideo = errorTrackExceptionType === HMSTrackExceptionTrackType.AUDIO_VIDEO;
    const hasScreen = errorTrackExceptionType === HMSTrackExceptionTrackType.SCREEN;

    const errorMessage = error?.message;
    ToastManager.addToast({
      title: `Error: ${errorMessage} - ${error?.description}`,
      action: (
        <Button outlined variant="standard" css={{ w: 'max-content' }} onClick={() => setShowDeviceInUseModal(true)}>
          Help
        </Button>
      ),
    });

    if (hasAudioVideo) {
      setDeviceType('camera and microphone');
    } else if (hasAudio) {
      setDeviceType('microphone');
    } else if (hasVideo) {
      setDeviceType('camera');
    } else if (hasScreen) {
      setDeviceType('screen');
    }
  }, [notification]);

  return (
    <Dialog.Root
      open={showDeviceInUseModal}
      onOpenChange={() => {
        setShowDeviceInUseModal(false);
      }}
    >
      <DialogContent title="Device Access Error">
        <DialogRow>
          <Text variant="body2">
            We weren't able to access your {deviceType} since it's either in use by another application or is not
            configured properly. Please follow the following instructions to resolve this issue.
          </Text>
        </DialogRow>
        <ol>
          <Instruction
            description={`Please check if the ${deviceType} device(s) are in use by another browser or application and close it.`}
          />
          <Instruction
            description={`Go to Browser Settings > Privacy and security > Site settings > ${deviceType} and check if your preferred device is selected as default.`}
          />
          <Instruction description="Try restarting the browser." />
          <Instruction description="Try disconnecting and reconnecting the external device if your intention is to use one." />
        </ol>
      </DialogContent>
    </Dialog.Root>
  );
}
