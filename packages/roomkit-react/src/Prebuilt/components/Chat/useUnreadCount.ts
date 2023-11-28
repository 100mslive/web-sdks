import {
  selectMessagesUnreadCountByPeerID,
  selectMessagesUnreadCountByRole,
  selectUnreadHMSMessagesCount,
  useHMSStore,
} from '@100mslive/react-sdk';

export const useUnreadCount = ({ role, peerId }: { role?: string; peerId?: string }) => {
  let unreadCountSelector;
  if (role) {
    unreadCountSelector = selectMessagesUnreadCountByRole(role);
  } else if (peerId) {
    unreadCountSelector = selectMessagesUnreadCountByPeerID(peerId);
  } else {
    unreadCountSelector = selectUnreadHMSMessagesCount;
  }

  return useHMSStore(unreadCountSelector);
};
