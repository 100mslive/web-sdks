import {
  selectBroadcastMessagesUnreadCount,
  selectMessagesUnreadCountByPeerID,
  selectMessagesUnreadCountByRole,
  useHMSStore,
} from "@100mslive/react-sdk";

export const useChatUnreadCount = ({ role, peerId }) => {
  const storeUnreadMessageCountSelector = role
    ? selectMessagesUnreadCountByRole(role)
    : peerId
    ? selectMessagesUnreadCountByPeerID(peerId)
    : selectBroadcastMessagesUnreadCount;
  const unreadCount = useHMSStore(storeUnreadMessageCountSelector);
  return unreadCount;
};
