import { useEffect, useState } from 'react';
import { selectSessionStore, useHMSStore } from '@100mslive/react-sdk';
import { PinnedMessage } from './usePinnedMessages';
import { SESSION_STORE_KEY } from '../../common/constants';

export const usePinnedBy = (messageId: string) => {
  const pinnedMessages = useHMSStore(selectSessionStore(SESSION_STORE_KEY.PINNED_MESSAGES));
  const [pinnedBy, setPinnedBy] = useState('');

  useEffect(() => {
    let match = '';
    pinnedMessages?.forEach((pinnedMessage: PinnedMessage) => {
      if (pinnedMessage.id === messageId) {
        match = pinnedMessage.pinnedBy;
      }
    });

    setPinnedBy(match);
  }, [messageId, pinnedMessages]);

  return pinnedBy;
};
