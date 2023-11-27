import {
  selectMessagesUnreadCountByPeerID,
  selectMessagesUnreadCountByRole,
  selectUnreadHMSMessagesCount,
  useHMSStore,
} from '@100mslive/react-sdk';

export const useUnreadCount = ({ role, peerId }: { role?: string; peerId?: string }) => {
  let unreadCountSelector: any = selectUnreadHMSMessagesCount;
  if (role) {
    unreadCountSelector = selectMessagesUnreadCountByRole(role);
  } else if (peerId) {
    unreadCountSelector = selectMessagesUnreadCountByPeerID(peerId);
  }

  const unreadCount = useHMSStore(unreadCountSelector);
  return unreadCount;
};
