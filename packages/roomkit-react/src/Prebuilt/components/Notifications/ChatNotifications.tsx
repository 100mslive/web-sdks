import { useEffect } from 'react';
import { v4 as uuid } from 'uuid';
import { selectLocalPeerID, selectSessionStore, useHMSStore } from '@100mslive/react-sdk';
import { ChatIcon, ChatUnreadIcon } from '@100mslive/react-icons';
// @ts-ignore
import { ToastManager } from '../Toast/ToastManager';
import { SESSION_STORE_KEY } from '../../common/constants';

const NOTIFICATION_TIME_DIFFERENCE = 5000;

export const ChatNotifications = () => {
  const chatState = useHMSStore(selectSessionStore(SESSION_STORE_KEY.CHAT_STATE));
  const localPeerId = useHMSStore(selectLocalPeerID);

  useEffect(() => {
    if (!chatState || chatState.updatedBy?.peerId === localPeerId) {
      return;
    }

    const showToast = Date.now() - chatState.updatedAt < NOTIFICATION_TIME_DIFFERENCE;

    if (!showToast) {
      return;
    }

    const notification = {
      id: uuid(),
      icon: chatState.enabled ? <ChatUnreadIcon /> : <ChatIcon />,
      title: `Chat ${chatState.enabled ? 'resumed' : 'paused'} by ${chatState.updatedBy?.userName}`,
    };
    ToastManager.addToast(notification);
  }, [chatState, localPeerId]);
  return <></>;
};
