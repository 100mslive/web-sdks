import React, { useEffect } from 'react';
import { HMSNotificationTypes, useHMSNotifications } from '@100mslive/react-sdk';
// @ts-ignore
import { useIsNotificationDisabled } from '../AppData/useUISettings';
import { useRedirectToLeave } from '../hooks/useRedirectToLeave';

export function HeadlessEndRoomListener() {
  const notification = useHMSNotifications();
  const isNotificationDisabled = useIsNotificationDisabled();
  const { redirectToLeave } = useRedirectToLeave();

  useEffect(() => {
    if (!notification || !isNotificationDisabled) {
      return;
    }
    if ([HMSNotificationTypes.ROOM_ENDED, HMSNotificationTypes.REMOVED_FROM_ROOM].includes(notification.type)) {
      redirectToLeave(1000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notification]);

  return <></>;
}
