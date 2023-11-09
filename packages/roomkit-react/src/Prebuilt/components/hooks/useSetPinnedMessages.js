// @ts-check
import { useCallback } from 'react';
import {
  selectPeerNameByID,
  selectSessionStore,
  useHMSActions,
  useHMSStore,
  useHMSVanillaStore,
} from '@100mslive/react-sdk';
import { ToastManager } from '../Toast/ToastManager';
import { SESSION_STORE_KEY } from '../../common/constants';

/**
 * set pinned chat message by updating the session store
 */
export const useSetPinnedMessages = () => {
  const hmsActions = useHMSActions();
  const vanillaStore = useHMSVanillaStore();
  const pinnedMessages = useHMSStore(selectSessionStore(SESSION_STORE_KEY.PINNED_MESSAGES)) || [];
  const setPinnedMessages = useCallback(
    /**
     * @param {import("@100mslive/react-sdk").HMSMessage | undefined} message
     */
    async message => {
      const peerName = vanillaStore.getState(selectPeerNameByID(message?.sender)) || message?.senderName;
      const newPinnedMessage = message ? (peerName ? `${peerName}: ${message.message}` : message.message) : null;
      if (newPinnedMessage && pinnedMessages.indexOf(newPinnedMessage) === -1) {
        await hmsActions.sessionStore
          .set(SESSION_STORE_KEY.PINNED_MESSAGES, [...pinnedMessages, newPinnedMessage])
          .catch(err => ToastManager.addToast({ title: err.description }));
      }
    },
    [hmsActions, vanillaStore, pinnedMessages],
  );

  const removePinnedMessage = useCallback(
    async indexToRemove => {
      if (pinnedMessages[indexToRemove]) {
        await hmsActions.sessionStore
          .set(
            SESSION_STORE_KEY.PINNED_MESSAGES,
            [...pinnedMessages].filter((pinnedMessage, index) => index !== indexToRemove),
          )
          .catch(err => ToastManager.addToast({ title: err.description }));
      }
    },
    [pinnedMessages, hmsActions],
  );

  return { setPinnedMessages, removePinnedMessage };
};
