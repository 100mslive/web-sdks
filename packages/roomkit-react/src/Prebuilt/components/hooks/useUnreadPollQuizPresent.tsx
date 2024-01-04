import { useEffect, useState } from 'react';
import { selectLocalPeerID } from '@100mslive/hms-video-store';
import { HMSNotificationTypes, useHMSNotifications, useHMSStore } from '@100mslive/react-sdk';

export const useUnreadPollQuizPresent = () => {
  const localPeerID = useHMSStore(selectLocalPeerID);
  const notification = useHMSNotifications();
  const [unreadPollQuiz, setUnreadPollQuiz] = useState(false);

  useEffect(() => {
    if (!notification) {
      return;
    }
    if (notification.type !== HMSNotificationTypes.POLL_STARTED) {
      return;
    }
    setUnreadPollQuiz(notification.data.startedBy !== localPeerID);
  }, [localPeerID, notification]);
  return { unreadPollQuiz, setUnreadPollQuiz };
};
