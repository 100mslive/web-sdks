import React, { useEffect } from 'react';
import { usePrevious } from 'react-use';
import { v4 as uuid } from 'uuid';
import { selectLocalPeerName, selectSessionStore, useHMSStore } from '@100mslive/react-sdk';
import { ChatIcon, ChatUnreadIcon } from '@100mslive/react-icons';
// @ts-ignore
import { ToastManager } from '../Toast/ToastManager';
import { SESSION_STORE_KEY } from '../../common/constants';

export const ChatNotifications = () => {
  const localPeerName = useHMSStore(selectLocalPeerName);
  const { enabled: isChatEnabled, updatedBy: chatStateUpdatedBy = '' } =
    useHMSStore(selectSessionStore(SESSION_STORE_KEY.CHAT_STATE)) || {};

  const previousChatEnabled = usePrevious(isChatEnabled);

  useEffect(() => {
    if (!chatStateUpdatedBy || chatStateUpdatedBy === localPeerName || previousChatEnabled === undefined) {
      return;
    }
    const notification = {
      id: uuid(),
      icon: isChatEnabled ? <ChatUnreadIcon /> : <ChatIcon />,
      title: isChatEnabled ? `Chat resumed by ${chatStateUpdatedBy}` : `Chat paused by ${chatStateUpdatedBy}`,
    };
    ToastManager.addToast(notification);
  }, [isChatEnabled, chatStateUpdatedBy, localPeerName]);
  return <></>;
};
