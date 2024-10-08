import { useEffect } from 'react';
import { HMSNotificationTypes, selectIsLocalScreenShared } from '@100mslive/hms-video-store';
import { useAwayNotifications, useHMSNotifications, useHMSStore } from '@100mslive/react-sdk';
import { useRoomLayout } from '../../provider/roomLayoutProvider';
import { usePIPWindow } from '../PIP/usePIPWindow';

export const MessageNotifications = () => {
  const notification = useHMSNotifications(HMSNotificationTypes.NEW_MESSAGE);
  const amIScreenSharing = useHMSStore(selectIsLocalScreenShared);
  const logoURL = useRoomLayout()?.logo?.url;
  const { pipWindow } = usePIPWindow();
  const { showNotification } = useAwayNotifications();

  useEffect(() => {
    if (notification && amIScreenSharing && !notification.data?.ignored && !pipWindow) {
      showNotification(`New message from ${notification.data.senderName}`, {
        body: notification.data.message,
        icon: logoURL,
      });
    }
  }, [notification]);

  return null;
};
