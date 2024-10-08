import React, { useEffect, useState } from 'react';
import { HMSNotificationTypes, useHMSNotifications } from '@100mslive/react-sdk';
import { Button, Dialog, Text } from '../../..';
// @ts-ignore: No implicit Any
import { DialogContent, DialogRow } from '../../primitives/DialogContent';
// @ts-ignore: No implicit Any
import { ToastManager } from '../Toast/ToastManager';

const Instruction = ({ number, description }: { number: string; description: string }) => (
  <DialogRow css={{ alignItems: 'baseline', justifyContent: 'normal', gap: '$4' }}>
    <Text variant="body2">{number}. </Text>
    <Text variant="body2">{description}</Text>
  </DialogRow>
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

    const errorMessage = error?.message;
    ToastManager.addToast({
      title: `Error: ${errorMessage} - ${error?.description}`,
      action: (
        <Button outlined variant="standard" css={{ w: 'max-content' }} onClick={() => setShowDeviceInUseModal(true)}>
          Help
        </Button>
      ),
    });

    const hasAudio = errorMessage.includes('audio');
    const hasVideo = errorMessage.includes('video');
    const hasScreen = errorMessage.includes('screen');
    if (hasAudio && hasVideo) {
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
        <Instruction
          number="1"
          description={`Please check if the ${deviceType} device(s) are in use by another browser or application and close it.`}
        />
        <Instruction
          number="2"
          description={`Go to Browser Settings > Privacy and security > Site settings > ${deviceType} and check if your preferred device is selected as default.`}
        />
        <Instruction number="3" description="Try restarting the browser." />
        <Instruction
          number="4"
          description="Try disconnecting and reconnecting the external device if your intention is to use one."
        />
      </DialogContent>
    </Dialog.Root>
  );
}
