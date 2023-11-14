import { useCallback } from 'react';
import { HMSMessageID, selectSessionStore, useHMSActions, useHMSStore } from '@100mslive/react-sdk';
// @ts-ignore
import { ToastManager } from '../Toast/ToastManager';
// @ts-ignore
import { SESSION_STORE_KEY } from '../../common/constants';

/**
 * set pinned chat message by updating the session store
 */
export const useBlacklistMessage = () => {
  const hmsActions = useHMSActions();

  const blacklistedMessageIDs = useHMSStore(selectSessionStore(SESSION_STORE_KEY.CHAT_MESSAGE_BLACKLIST)) || [];

  const blacklistMessage = useCallback(
    async (id: HMSMessageID) => {
      console.log('ollo', id, blacklistedMessageIDs);
      await hmsActions.sessionStore
        .set(SESSION_STORE_KEY.CHAT_MESSAGE_BLACKLIST, [...blacklistedMessageIDs, id])
        .catch(err => ToastManager.addToast({ title: err.description }));
    },
    [hmsActions],
  );

  return { blacklistMessage };
};
