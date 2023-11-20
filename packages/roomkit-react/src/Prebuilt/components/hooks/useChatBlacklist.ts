import { useCallback } from 'react';
import { selectSessionStore, useHMSActions, useHMSStore } from '@100mslive/react-sdk';
// @ts-ignore
import { ToastManager } from '../Toast/ToastManager';
// @ts-ignore
import { SESSION_STORE_KEY } from '../../common/constants';

export const useChatBlacklist = (
  sessionStoreKey: SESSION_STORE_KEY.CHAT_MESSAGE_BLACKLIST | SESSION_STORE_KEY.CHAT_PEER_BLACKLIST,
) => {
  const hmsActions = useHMSActions();

  const blacklistedIDs = useHMSStore(selectSessionStore(sessionStoreKey)) || [];

  const blacklistItem = useCallback(
    async (blacklistID: string) =>
      await hmsActions.sessionStore
        .set(sessionStoreKey, [...blacklistedIDs, blacklistID])
        .catch(err => ToastManager.addToast({ title: err.description })),
    [hmsActions, blacklistedIDs, sessionStoreKey],
  );

  return { blacklistItem };
};
