import { useEffect } from 'react';
import { HMSNotificationTypes, useHMSActions, useHMSNotifications } from '@100mslive/react-sdk';
import { ToastBatcher } from '../Toast/ToastBatcher';
import { useIsHeadless, useSubscribedNotifications } from '../AppData/useUISettings';
import { ROLE_CHANGE_DECLINED, SUBSCRIBED_NOTIFICATIONS } from '../../common/constants';

export const MessageNotifications = () => {
  const hmsActions = useHMSActions();
  hmsActions.ignoreMessageTypes([ROLE_CHANGE_DECLINED]);
  const notification = useHMSNotifications(HMSNotificationTypes.NEW_MESSAGE);
  const isNewMessageSubscribed = useSubscribedNotifications(SUBSCRIBED_NOTIFICATIONS.NEW_MESSAGE);
  const isHeadless = useIsHeadless();

  useEffect(() => {
    if (!notification || isHeadless) {
      return;
    }

    console.debug(`[${notification.type}]`, notification);
    if (!isNewMessageSubscribed || notification.data?.ignored) {
      return;
    }
    ToastBatcher.showToast({ notification });
  }, [notification, isNewMessageSubscribed, isHeadless]);

  return null;
};
