import React, { useEffect, useState } from 'react';
import { HMSNotificationTypes, useHMSNotifications } from '@100mslive/react-sdk';
import { Button, Dialog, Text } from '../../..';
// @ts-ignore: No implicit Any
import { DialogContent, DialogRow } from '../../primitives/DialogContent';

export const AudioInterruptionModal = () => {
  const notification = useHMSNotifications([
    HMSNotificationTypes.AUDIO_INTERRUPTION_START,
    HMSNotificationTypes.AUDIO_INTERRUPTION_END,
  ]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!notification) {
      return;
    }
    setOpen(notification.type === HMSNotificationTypes.AUDIO_INTERRUPTION_START);
  }, [notification]);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <DialogContent title="Microphone interrupted" closeable={false}>
        <DialogRow>
          <Text variant="md">
            Another app or an incoming call is using your microphone, so others can't hear you. Once you're done there,
            your microphone will be restored automatically.
          </Text>
        </DialogRow>
        <DialogRow justify="end">
          <Button variant="primary" onClick={() => setOpen(false)}>
            Dismiss
          </Button>
        </DialogRow>
      </DialogContent>
    </Dialog.Root>
  );
};
