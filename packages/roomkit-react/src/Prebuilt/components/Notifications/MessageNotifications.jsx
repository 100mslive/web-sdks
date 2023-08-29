import { useEffect } from 'react';
import { HMSNotificationTypes, useHMSActions, useHMSNotifications } from '@100mslive/react-sdk';
import { ToastBatcher } from '../Toast/ToastBatcher';
import { useIsHeadless, useSubscribedNotifications } from '../AppData/useUISettings';
import { useMyMetadata } from '../hooks/useMetadata';
import { LOWER_HAND, SUBSCRIBED_NOTIFICATIONS } from '../../common/constants';

export const MessageNotifications = () => {
  const hmsActions = useHMSActions();
  hmsActions.ignoreMessageTypes([LOWER_HAND]);
  const notification = useHMSNotifications(HMSNotificationTypes.NEW_MESSAGE);
  const isNewMessageSubscribed = useSubscribedNotifications(SUBSCRIBED_NOTIFICATIONS.NEW_MESSAGE);
  const isHeadless = useIsHeadless();
  const { metaData, updateMetaData } = useMyMetadata();

  useEffect(() => {
    if (!notification || isHeadless) {
      return;
    }

    if (notification.data?.type === LOWER_HAND) {
      const newMetadata = { ...metaData, isHandRaised: false };
      updateMetaData(newMetadata);
    }
    console.debug(`[${notification.type}]`, notification);
    if (!isNewMessageSubscribed || notification.data?.ignored) {
      return;
    }
    ToastBatcher.showToast({ notification });
  }, [notification, isNewMessageSubscribed, isHeadless, metaData, updateMetaData]);

  return null;
};
