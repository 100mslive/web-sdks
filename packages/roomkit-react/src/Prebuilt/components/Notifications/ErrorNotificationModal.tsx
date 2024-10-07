import React, { useEffect } from 'react';
import { HMSNotificationTypes, useHMSNotifications } from '@100mslive/react-sdk';
import { GroupIcon } from '@100mslive/react-icons';
import { Box } from '../../../Layout';
import { ToastManager } from '../Toast/ToastManager';
import { AutoplayBlockedModal } from './AutoplayBlockedModal';
import { InitErrorModal } from './InitErrorModal';
import { PermissionErrorNotificationModal } from './PermissionErrorModal';
import { useSubscribedNotifications } from '../AppData/useUISettings';

export const ErrorNotificationModal = () => {
  const notification = useHMSNotifications(HMSNotificationTypes.ERROR);
  const subscribedNotifications = useSubscribedNotifications() || {};

  useEffect(() => {
    if (notification) {
      if (notification.data?.isTerminal && notification.data?.action !== 'INIT') {
        if ([500, 6008].includes(notification.data?.code)) {
          ToastManager.addToast({
            title: `Error: ${notification.data?.message}`,
          });
        } else if (notification.data?.message === 'role limit reached') {
          ToastManager.addToast({
            title: 'The room is currently full, try joining later',
            close: true,
            icon: (
              <Box css={{ color: '$alert_error_default' }}>
                <GroupIcon />
              </Box>
            ),
          });
        } else {
          ToastManager.addToast({
            title:
              notification.data?.message || 'We couldn’t reconnect you. When you’re back online, try joining the room.',
            close: false,
          });
        }
        return;
      }
      // Autoplay error or user denied screen share (cancelled browser pop-up)
      if (notification.data?.code === 3008 || notification.data?.code === 3001 || notification.data?.code === 3011) {
        return;
      }
      if (notification.data?.action === 'INIT') {
        return;
      }
      if (!subscribedNotifications.ERROR) return;
      ToastManager.addToast({
        title: `Error: ${notification.data?.message} - ${notification.data?.description}`,
      });
    }
  }, [notification, subscribedNotifications.ERROR]);

  return (
    <>
      <AutoplayBlockedModal />
      <PermissionErrorNotificationModal />
      <InitErrorModal />
    </>
  );
};
