import { useEffect } from 'react';
import { HMSNotificationTypes, useHMSNotifications } from '@100mslive/react-sdk';
import { GroupIcon } from '@100mslive/react-icons';
import { Box } from '../../../Layout';
// @ts-ignore: No implicit Any
import { ToastManager } from '../Toast/ToastManager';
// @ts-ignore: No implicit Any
import { useSubscribedNotifications } from '../AppData/useUISettings';

export const ErrorNotifications = () => {
  const notification = useHMSNotifications(HMSNotificationTypes.ERROR);
  const subscribedNotifications = useSubscribedNotifications() || {};

  useEffect(() => {
    if (!notification || !notification.data) return;

    const { isTerminal, action, code, message, description } = notification.data;

    if (isTerminal && action !== 'INIT') {
      if ([500, 6008].includes(code)) {
        ToastManager.addToast({
          title: `Error: ${message}`,
        });
      } else if (message === 'role limit reached') {
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
          title: message || 'We couldn’t reconnect you. When you’re back online, try joining the room.',
          close: false,
        });
      }
      return;
    }
    // Autoplay error or user denied screen share (cancelled browser pop-up)
    if ([3008, 3001, 3011].includes(code)) {
      return;
    }
    if (action === 'INIT') {
      return;
    }
    if (!subscribedNotifications.ERROR) return;
    ToastManager.addToast({
      title: `Error: ${message} - ${description}`,
    });
  }, [notification, subscribedNotifications.ERROR]);

  return null;
};
