import { useCallback } from 'react';
import { selectSessionStore, useHMSActions, useHMSStore } from '@100mslive/react-sdk';
// @ts-ignore
import { ToastManager } from '../Toast/ToastManager';

export const useBlacklist = (sessionStoreKey: string) => {
  const hmsActions = useHMSActions();

  const blacklistedIDs = useHMSStore(selectSessionStore(sessionStoreKey)) || [];

  const blacklistItem = useCallback(
    async (blacklistID: string) =>
      await hmsActions.sessionStore
        .set(sessionStoreKey, [...blacklistedIDs, blacklistID])
        .catch(err => ToastManager.addToast({ title: err.description })),
    [hmsActions, blacklistedIDs],
  );

  return { blacklistItem };
};
