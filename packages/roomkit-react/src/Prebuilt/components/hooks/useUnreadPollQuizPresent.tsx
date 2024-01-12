import { useEffect, useState } from 'react';
import { selectLocalPeerID } from '@100mslive/hms-video-store';
import { HMSNotificationTypes, useHMSNotifications, useHMSStore } from '@100mslive/react-sdk';

export const useUnreadPollQuizPresent = () => {
  const localPeerID = useHMSStore(selectLocalPeerID);
  const notification = useHMSNotifications(HMSNotificationTypes.POLL_STARTED);
  const [unreadPollQuiz, setUnreadPollQuiz] = useState(false);

  useEffect(() => {
    if (!notification) {
      return;
    }
    setUnreadPollQuiz(notification.data.startedBy !== localPeerID);
  }, [localPeerID, notification]);
  return { unreadPollQuiz, setUnreadPollQuiz };
};
