import React, { useEffect, useState } from 'react';
import { HMSNotificationTypes, useHMSNotifications } from '@100mslive/react-sdk';
import { Dialog, Flex, Loading, Text } from '../../..';
// @ts-ignore: No implicit Any
import { ToastConfig } from '../Toast/ToastConfig';
// @ts-ignore: No implicit Any
import { ToastManager } from '../Toast/ToastManager';

const notificationTypes = [
  HMSNotificationTypes.RECONNECTED,
  HMSNotificationTypes.RECONNECTING,
  HMSNotificationTypes.ERROR,
];
let notificationId: string | null = null;

export const ReconnectNotifications = () => {
  const notification = useHMSNotifications(notificationTypes);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!notification) {
      return;
    }
    if (notification.type === HMSNotificationTypes.ERROR && notification.data?.isTerminal) {
      setOpen(false);
    } else if (notification.type === HMSNotificationTypes.RECONNECTED) {
      notificationId = ToastManager.replaceToast(notificationId, ToastConfig.RECONNECTED.single());
      setOpen(false);
    } else if (notification.type === HMSNotificationTypes.RECONNECTING) {
      notificationId = ToastManager.replaceToast(
        notificationId,
        ToastConfig.RECONNECTING.single(notification.data?.message),
      );
    }
  }, [notification]);
  if (!open) return null;
  return (
    <Dialog.Root open={open} modal={true}>
      <Dialog.Portal container={document.getElementById('conferencing')}>
        <Dialog.Overlay />
        <Dialog.Content
          css={{
            width: 'fit-content',
            maxWidth: '80%',
            p: '$4 $8',
            position: 'relative',
            top: 'unset',
            bottom: '$9',
            transform: 'translate(-50%, -100%)',
            animation: 'none !important',
          }}
        >
          <Flex align="center">
            <div style={{ display: 'inline', margin: '0.25rem' }}>
              <Loading size={16} />
            </div>
            <Text css={{ fontSize: '$space$8', color: '$on_surface_high' }}>
              You lost your network connection. Trying to reconnect.
            </Text>
          </Flex>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
