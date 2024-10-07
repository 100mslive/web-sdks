import { useEffect } from 'react';
import { HMSNotificationTypes, useHMSNotifications } from '@100mslive/react-sdk';
import { useUpdateRoomLayout } from '../../provider/roomLayoutProvider';
// @ts-ignore: No implicit Any
import { ToastBatcher } from '../Toast/ToastBatcher';
// @ts-ignore: No implicit Any
import { ToastManager } from '../Toast/ToastManager';
// @ts-ignore: No implicit Any
import { useSetSubscribedChatSelector, useSubscribedNotifications } from '../AppData/useUISettings';
// @ts-ignore: No implicit Any
import { CHAT_SELECTOR, SUBSCRIBED_NOTIFICATIONS } from '../../common/constants';

const notificationTypes = [
  HMSNotificationTypes.PEER_JOINED,
  HMSNotificationTypes.PEER_LEFT,
  HMSNotificationTypes.NAME_UPDATED,
  HMSNotificationTypes.ROLE_UPDATED,
];

export const PeerNotifications = () => {
  const notification = useHMSNotifications(notificationTypes);
  const isPeerJoinSubscribed = useSubscribedNotifications(SUBSCRIBED_NOTIFICATIONS.PEER_JOINED);
  const isPeerLeftSubscribed = useSubscribedNotifications(SUBSCRIBED_NOTIFICATIONS.PEER_LEFT);
  const [selectedPeer, setPeerSelector] = useSetSubscribedChatSelector(CHAT_SELECTOR.PEER);
  const updateRoomLayoutForRole = useUpdateRoomLayout();

  useEffect(() => {
    if (!notification?.data) {
      return;
    }

    console.debug(`[${notification.type}]`, notification);
    switch (notification.type) {
      case HMSNotificationTypes.PEER_JOINED:
        if (!isPeerJoinSubscribed) {
          return;
        }
        break;
      case HMSNotificationTypes.PEER_LEFT:
        if (selectedPeer.id === notification.data.id) {
          setPeerSelector({});
        }
        if (!isPeerLeftSubscribed) {
          return;
        }
        break;
      case HMSNotificationTypes.NAME_UPDATED:
        console.log(notification.data.id + ' changed their name to ' + notification.data.name);
        return;
      case HMSNotificationTypes.ROLE_UPDATED: {
        if (notification.data?.isLocal && notification.data?.roleName) {
          ToastManager.addToast({
            title: `You are now a ${notification.data.roleName}`,
          });
          updateRoomLayoutForRole?.(notification.data.roleName);
        }
        return;
      }
      default:
        return;
    }
    ToastBatcher.showToast({ notification });
  }, [
    notification,
    isPeerJoinSubscribed,
    isPeerLeftSubscribed,
    selectedPeer.id,
    setPeerSelector,
    updateRoomLayoutForRole,
  ]);

  return null;
};
