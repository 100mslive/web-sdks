import { useEffect } from 'react';
import { HMSNotificationTypes, useHMSActions, useHMSNotifications } from '@100mslive/react-sdk';
import { ToastBatcher } from '../Toast/ToastBatcher';
import { useIsHeadless, useSubscribedNotifications } from '../AppData/useUISettings';
import { useIsFeatureEnabled } from '../hooks/useFeatures';
import { useMyMetadata } from '../hooks/useMetadata';
import { FEATURE_LIST, LOWER_HAND, SUBSCRIBED_NOTIFICATIONS } from '../../common/constants';

export const MessageNotifications = () => {
  const hmsActions = useHMSActions();
  hmsActions.ignoreMessageTypes([LOWER_HAND]);
  const notification = useHMSNotifications(HMSNotificationTypes.NEW_MESSAGE);
  const isChatEnabled = useIsFeatureEnabled(FEATURE_LIST.CHAT);
  const isNewMessageSubscribed = useSubscribedNotifications(SUBSCRIBED_NOTIFICATIONS.NEW_MESSAGE);
  const isHeadless = useIsHeadless();
  const metadata = useMyMetadata();

  useEffect(() => {
    if (!notification || isHeadless) {
      return;
    }

    if (notification.data?.type === LOWER_HAND) {
      const newMetadata = { ...metadata, isHandRaised: false };
      hmsActions.changeMetadata(newMetadata);
    }
    console.debug(`[${notification.type}]`, notification);
    if (!isNewMessageSubscribed || notification.data?.ignored || !isChatEnabled) {
      return;
    }
    ToastBatcher.showToast({ notification });
  }, [notification, isNewMessageSubscribed, isHeadless, isChatEnabled]);

  return null;
};
