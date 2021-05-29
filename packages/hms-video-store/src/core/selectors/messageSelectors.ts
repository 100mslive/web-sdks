import { HMSMessage, HMSStore } from '../schema';
import { createSelector } from 'reselect';

export const selectMessagesMap = (store: HMSStore) => store.messages.byID;
export const selectMessageIDsInOrder = (store: HMSStore) => store.messages.allIDs;

export const selectHMSMessagesCount = createSelector(
  selectMessageIDsInOrder,
  messageIDs => messageIDs.length,
);

export const selectUnreadHMSMessagesCount = createSelector(selectMessagesMap, messages => {
  return Object.values(messages).filter(m => !m.read).length;
});

export const selectHMSMessages = createSelector(
  selectMessageIDsInOrder,
  selectMessagesMap,
  (msgIDs, msgMap) => {
    const messages: HMSMessage[] = [];
    msgIDs.forEach(msgId => {
      messages.push(msgMap[msgId]);
    });
    return messages;
  },
);
