import React, { useEffect } from 'react';
import { v4 as uuid } from 'uuid';
import { selectLocalPeerID, selectSessionStore, useHMSStore } from '@100mslive/react-sdk';
import { ChatIcon, ChatUnreadIcon } from '@100mslive/react-icons';
// @ts-ignore
import { ToastManager } from '../Toast/ToastManager';
import { SESSION_STORE_KEY } from '../../common/constants';

const NOTIFICATION_TIME_DIFFERENCE = 5000;

export const ChatNotifications = () => {
  const {
    enabled: isChatEnabled,
    updatedBy: chatStateUpdatedBy,
    updatedAt,
  } = useHMSStore(selectSessionStore(SESSION_STORE_KEY.CHAT_STATE)) || {
    enabled: true,
    updatedBy: undefined,
    updatedAt: 0,
  };

  const localPeerId = useHMSStore(selectLocalPeerID);

  useEffect(() => {
    if (!chatStateUpdatedBy?.userId || localPeerId === chatStateUpdatedBy?.peerId) {
      return;
    }

    const showToast = new Date().getTime() - updatedAt < NOTIFICATION_TIME_DIFFERENCE;

    if (!showToast) {
      return;
    }

    const notification = {
      id: uuid(),
      icon: isChatEnabled ? <ChatUnreadIcon /> : <ChatIcon />,
      title: isChatEnabled
        ? `Chat resumed by ${chatStateUpdatedBy.userName}`
        : `Chat paused by ${chatStateUpdatedBy.userName}`,
    };
    ToastManager.addToast(notification);
  }, [isChatEnabled, chatStateUpdatedBy]);
  return <></>;
};
