import React, { useEffect, useState } from 'react';
import { HMSNotificationTypes, useHMSNotifications } from '@100mslive/react-sdk';
import { Button, Dialog, Text } from '../../..';
// @ts-ignore: No implicit Any
import { DialogContent, DialogRow } from '../../primitives/DialogContent';

export const TrackInterruptionModal = () => {
  const notification = useHMSNotifications([
    HMSNotificationTypes.TRACK_INTERRUPTION_START,
    HMSNotificationTypes.TRACK_INTERRUPTION_END,
  ]);
  const [interrupted, setInterrupted] = useState<'audio' | 'video' | undefined>(undefined);

  useEffect(() => {
    if (!notification) {
      return;
    }
    setInterrupted(
      notification.type === HMSNotificationTypes.TRACK_INTERRUPTION_START ? notification.data.type : undefined,
    );
  }, [notification]);

  const device = interrupted === 'video' ? 'Camera' : 'Microphone';

  return (
    <Dialog.Root open={!!interrupted} onOpenChange={() => setInterrupted(undefined)}>
      <DialogContent title={`${device} interrupted`} closeable={false}>
        <DialogRow>
          <Text variant="md">
            {`Another app or an incoming call is using your ${device.toLowerCase()}. Once you're done there, it will be
            restored automatically.`}
          </Text>
        </DialogRow>
        <DialogRow justify="end">
          <Button variant="primary" onClick={() => setInterrupted(undefined)}>
            Dismiss
          </Button>
        </DialogRow>
      </DialogContent>
    </Dialog.Root>
  );
};
