import React, { useEffect, useState } from 'react';
import { HMSNotificationTypes, useHMSNotifications } from '@100mslive/react-sdk';
import { Button, Dialog, Flex, Text } from '../../../';

export function PermissionErrorModal() {
  const notification = useHMSNotifications(HMSNotificationTypes.ERROR);
  const [deviceType, setDeviceType] = useState('');
  const [isSystemError, setIsSystemError] = useState(false);

  useEffect(() => {
    if (
      !notification ||
      (notification.data?.code !== 3001 && notification.data?.code !== 3011) ||
      (notification.data?.code === 3001 && notification.data?.message.includes('screen'))
    ) {
      return;
    }
    console.error(`[${notification.type}]`, notification);
    const errorMessage = notification.data?.message;
    const hasAudio = errorMessage.includes('audio');
    const hasVideo = errorMessage.includes('video');
    const hasScreen = errorMessage.includes('screen');
    if (hasAudio && hasVideo) {
      setDeviceType('Camera and microphone');
    } else if (hasAudio) {
      setDeviceType('Microphone');
    } else if (hasVideo) {
      setDeviceType('Camera');
    } else if (hasScreen) {
      setDeviceType('Screenshare');
    }
    setIsSystemError(notification.data.code === 3011);
  }, [notification]);

  return deviceType ? (
    <Dialog.Root open={!!deviceType}>
      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Content css={{ w: 'min(380px, 90%)', p: '$8' }}>
          <Dialog.Title
            css={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid $border_default',
            }}
          >
            <Text variant="h6">{deviceType} permissions are blocked</Text>
          </Dialog.Title>
          <Text variant="sm" css={{ pt: '$4', pb: '$10', color: '$on_surface_medium' }}>
            Access to {deviceType} is required.&nbsp;
            {isSystemError
              ? `Enable permissions for ${deviceType} from sytem settings`
              : `Enable permissions for ${deviceType} from address bar or browser settings.`}
          </Text>
          <Flex justify="end" css={{ w: '100%' }}>
            <Button outlined variant="standard" onClick={() => setDeviceType('')}>
              Dismiss
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  ) : null;
}
