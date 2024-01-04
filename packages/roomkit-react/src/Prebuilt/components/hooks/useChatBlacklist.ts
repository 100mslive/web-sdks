import { useCallback } from 'react';
import { selectLocalPeer, selectSessionStore, useHMSActions, useHMSStore } from '@100mslive/react-sdk';
// @ts-ignore
import { ToastManager } from '../Toast/ToastManager';
import { SESSION_STORE_KEY } from '../../common/constants';

export const useChatBlacklist = (
  sessionStoreKey: SESSION_STORE_KEY.CHAT_MESSAGE_BLACKLIST | SESSION_STORE_KEY.CHAT_PEER_BLACKLIST,
) => {
  const hmsActions = useHMSActions();
  const blacklistedIDs = useHMSStore(selectSessionStore(sessionStoreKey));

  const blacklistItem = useCallback(
    async (blacklistID: string) => {
      await hmsActions.sessionStore
        .set(sessionStoreKey, [...(blacklistedIDs || []), blacklistID])
        .catch(err => ToastManager.addToast({ title: err.description }));
    },
    [hmsActions, sessionStoreKey, blacklistedIDs],
  );

  return { blacklistItem, blacklistedIDs };
};

export const useIsPeerBlacklisted = ({ local = false, peerCustomerUserId = '' }) => {
  const localPeer = useHMSStore(selectLocalPeer);
  const blacklistedPeerIDs = useHMSStore(selectSessionStore(SESSION_STORE_KEY.CHAT_PEER_BLACKLIST)) || [];
  return blacklistedPeerIDs?.includes(local ? localPeer?.customerUserId : peerCustomerUserId);
};
