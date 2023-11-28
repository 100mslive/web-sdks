import { useCallback } from 'react';
import { HMSMessage, selectPeerNameByID, useHMSActions, useHMSVanillaStore } from '@100mslive/react-sdk';
// @ts-ignore
import { ToastManager } from '../Toast/ToastManager';
// @ts-ignore
import { SESSION_STORE_KEY } from '../../common/constants';

type PinnedMessage = {
  text: string;
  id: string;
  authorId: string;
  pinnedBy: string;
};

/**
 * set pinned chat message by updating the session store
 */
export const useSetPinnedMessages = () => {
  const hmsActions = useHMSActions();
  const vanillaStore = useHMSVanillaStore();

  const setPinnedMessages = useCallback(
    async (pinnedMessages: PinnedMessage[] = [], message: HMSMessage, pinnedBy: string) => {
      const peerName = vanillaStore.getState(selectPeerNameByID(message?.sender)) || message?.senderName;
      const newPinnedMessage = { text: '', id: message.id, pinnedBy, authorId: message?.senderUserId || '' };

      if (message && peerName) {
        newPinnedMessage['text'] = `${peerName}: ${message.message}`;
      } else if (message) {
        newPinnedMessage['text'] = message.message;
      }

      if (newPinnedMessage && !pinnedMessages.find(pinnedMessage => pinnedMessage.id === newPinnedMessage.id)) {
        await hmsActions.sessionStore
          .set(SESSION_STORE_KEY.PINNED_MESSAGES, [...pinnedMessages, newPinnedMessage].slice(-3)) // Limiting to maximum of 3 messages - FIFO
          .catch(err => ToastManager.addToast({ title: err.description }));
      }
    },
    [hmsActions, vanillaStore],
  );

  const removePinnedMessage = useCallback(
    async (pinnedMessages: PinnedMessage[] = [], indexToRemove: number) => {
      if (pinnedMessages[indexToRemove]) {
        await hmsActions.sessionStore
          .set(
            SESSION_STORE_KEY.PINNED_MESSAGES,
            pinnedMessages.filter((_, index: number) => index !== indexToRemove),
          )
          .catch(err => ToastManager.addToast({ title: err.description }));
      }
    },
    [hmsActions],
  );

  const unpinBlacklistedMessages = useCallback(
    async (
      pinnedMessages: PinnedMessage[] = [],
      blacklistedPeerIDSet: Set<string>,
      blacklistedMessageIDSet: Set<string>,
    ) => {
      const filteredPinnedMessages = pinnedMessages?.filter(
        pinnedMessage =>
          !blacklistedMessageIDSet?.has(pinnedMessage.id) && !blacklistedPeerIDSet.has(pinnedMessage.authorId),
      );

      await hmsActions.sessionStore
        .set(SESSION_STORE_KEY.PINNED_MESSAGES, filteredPinnedMessages)
        .catch(err => ToastManager.addToast({ title: err.description }));
    },
    [hmsActions],
  );

  return { setPinnedMessages, removePinnedMessage, unpinBlacklistedMessages };
};
