import { useCallback } from 'react';
import {
  HMSMessage,
  selectPeerNameByID,
  selectSessionStore,
  useHMSActions,
  useHMSStore,
  useHMSVanillaStore,
} from '@100mslive/react-sdk';
// @ts-ignore
import { ToastManager } from '../Toast/ToastManager';
// @ts-ignore
import { SESSION_STORE_KEY } from '../../common/constants';

type PinnedMessage = {
  text: string;
  id: string;
  authorId?: string;
  pinnedBy: string;
};

/**
 * set pinned chat message by updating the session store
 */
export const useSetPinnedMessages = () => {
  const hmsActions = useHMSActions();
  const vanillaStore = useHMSVanillaStore();
  const pinnedMessages = useHMSStore(selectSessionStore(SESSION_STORE_KEY.PINNED_MESSAGES)) || [];
  const setPinnedMessages = useCallback(
    async (message: HMSMessage, pinnedBy: string) => {
      const peerName = vanillaStore.getState(selectPeerNameByID(message?.sender)) || message?.senderName;
      const newPinnedMessage = { text: '', id: message.id, pinnedBy, authorId: message?.sender };

      if (message && peerName) {
        newPinnedMessage['text'] = `${peerName}: ${message.message}`;
      } else if (message) {
        newPinnedMessage['text'] = message.message;
      }

      if (
        newPinnedMessage &&
        pinnedMessages.findIndex((pinnedMessage: PinnedMessage) => pinnedMessage.id === newPinnedMessage.id) === -1
      ) {
        await hmsActions.sessionStore
          .set(SESSION_STORE_KEY.PINNED_MESSAGES, [...pinnedMessages, newPinnedMessage].slice(-3)) // Limiting to maximum of 3 messages - FIFO
          .catch(err => ToastManager.addToast({ title: err.description }));
      }
    },
    [hmsActions, vanillaStore, pinnedMessages],
  );

  const removePinnedMessage = useCallback(
    async (indexToRemove: number) => {
      if (pinnedMessages[indexToRemove]) {
        await hmsActions.sessionStore
          .set(
            SESSION_STORE_KEY.PINNED_MESSAGES,
            pinnedMessages.filter((_: string, index: number) => index !== indexToRemove),
          )
          .catch(err => ToastManager.addToast({ title: err.description }));
      }
    },
    [pinnedMessages, hmsActions],
  );

  return { setPinnedMessages, removePinnedMessage };
};
