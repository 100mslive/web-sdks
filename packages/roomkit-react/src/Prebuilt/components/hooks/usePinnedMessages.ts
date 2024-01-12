import { useCallback } from 'react';
import {
  HMSMessage,
  selectPeerNameByID,
  selectSessionStore,
  useHMSActions,
  useHMSVanillaStore,
} from '@100mslive/react-sdk';
// @ts-ignore
import { ToastManager } from '../Toast/ToastManager';
// @ts-ignore
import { SESSION_STORE_KEY } from '../../common/constants';

export type PinnedMessage = {
  text: string;
  id: string;
  pinnedBy: string;
};

/**
 * set pinned chat message by updating the session store
 */
export const usePinnedMessages = () => {
  const hmsActions = useHMSActions();
  const vanillaStore = useHMSVanillaStore();

  const setPinnedMessages = useCallback(
    async (message: HMSMessage, pinnedBy: string) => {
      const peerName = vanillaStore.getState(selectPeerNameByID(message?.sender)) || message?.senderName;
      const newPinnedMessage = { text: '', id: message.id, pinnedBy };

      if (message && peerName) {
        newPinnedMessage['text'] = `${peerName}: ${message.message}`;
      } else if (message) {
        newPinnedMessage['text'] = message.message;
      }

      const pinnedMessages = vanillaStore.getState(selectSessionStore(SESSION_STORE_KEY.PINNED_MESSAGES)) || [];
      if (!pinnedMessages?.find((pinnedMessage: PinnedMessage) => pinnedMessage.id === newPinnedMessage.id)) {
        await hmsActions.sessionStore
          .set(SESSION_STORE_KEY.PINNED_MESSAGES, [...pinnedMessages, newPinnedMessage].slice(-3)) // Limiting to maximum of 3 messages - FIFO
          .catch(err => ToastManager.addToast({ title: err.description }));
      }
    },
    [hmsActions, vanillaStore],
  );

  const removePinnedMessage = useCallback(
    async (indexToRemove: number) => {
      const pinnedMessages = vanillaStore.getState(selectSessionStore(SESSION_STORE_KEY.PINNED_MESSAGES)) || [];
      if (pinnedMessages[indexToRemove]) {
        await hmsActions.sessionStore
          .set(
            SESSION_STORE_KEY.PINNED_MESSAGES,
            pinnedMessages.filter((_: PinnedMessage, index: number) => index !== indexToRemove),
          )
          .catch(err => ToastManager.addToast({ title: err.description }));
      }
    },
    [hmsActions, vanillaStore],
  );

  const unpinBlacklistedMessages = useCallback(
    async (blacklistedMessageIDSet: Set<string>) => {
      const pinnedMessages = vanillaStore.getState(selectSessionStore(SESSION_STORE_KEY.PINNED_MESSAGES)) || [];
      const filteredPinnedMessages = pinnedMessages?.filter(
        (pinnedMessage: PinnedMessage) => !blacklistedMessageIDSet?.has(pinnedMessage.id),
      );

      await hmsActions.sessionStore
        .set(SESSION_STORE_KEY.PINNED_MESSAGES, filteredPinnedMessages)
        .catch(err => ToastManager.addToast({ title: err.description }));
    },
    [hmsActions, vanillaStore],
  );

  return { setPinnedMessages, removePinnedMessage, unpinBlacklistedMessages };
};
