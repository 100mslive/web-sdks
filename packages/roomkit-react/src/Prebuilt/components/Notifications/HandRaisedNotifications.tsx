import { useEffect } from 'react';
import { useDebounce } from 'react-use';
import {
  HMSNotificationTypes,
  HMSRoomState,
  selectHandRaisedPeers,
  selectHasPeerHandRaised,
  selectIsLocalScreenShared,
  selectPeerByID,
  selectRoomState,
  useAwayNotifications,
  useHMSNotifications,
  useHMSStore,
  useHMSVanillaStore,
} from '@100mslive/react-sdk';
import { useRoomLayout } from '../../provider/roomLayoutProvider';
// @ts-ignore: No implicit Any
import { ToastBatcher } from '../Toast/ToastBatcher';
import { useRoomLayoutConferencingScreen } from '../../provider/roomLayoutProvider/hooks/useRoomLayoutScreen';
// @ts-ignore: No implicit Any
import { useSubscribedNotifications } from '../AppData/useUISettings';
import { SUBSCRIBED_NOTIFICATIONS } from '../../common/constants';

export const HandRaisedNotifications = () => {
  const notification = useHMSNotifications(HMSNotificationTypes.HAND_RAISE_CHANGED);
  const roomState = useHMSStore(selectRoomState);
  const vanillaStore = useHMSVanillaStore();
  const { on_stage_exp } = useRoomLayoutConferencingScreen().elements || {};
  const isSubscribing = !!useSubscribedNotifications(SUBSCRIBED_NOTIFICATIONS.METADATA_UPDATED);
  const amIScreenSharing = useHMSStore(selectIsLocalScreenShared);
  const { showNotification } = useAwayNotifications();
  const logoURL = useRoomLayout()?.logo?.url;

  useEffect(() => {
    if (!notification?.data) {
      return;
    }

    // Don't show toast message in case of local peer.
    if (roomState !== HMSRoomState.Connected || notification.data.isLocal || !isSubscribing) {
      return;
    }

    const hasPeerHandRaised = vanillaStore.getState(selectHasPeerHandRaised(notification.data.id));
    const peer = vanillaStore.getState(selectPeerByID(notification.data.id));
    if (hasPeerHandRaised) {
      const showCTA = peer?.roleName && (on_stage_exp?.off_stage_roles || [])?.includes(peer.roleName);
      ToastBatcher.showToast({ notification, type: showCTA ? 'RAISE_HAND_HLS' : 'RAISE_HAND' });
      console.debug('Metadata updated', notification.data);
    }
  }, [isSubscribing, notification, on_stage_exp, roomState, vanillaStore]);

  useDebounce(
    () => {
      if (!notification?.data) {
        return;
      }

      // Don't show toast message in case of local peer.
      if (roomState !== HMSRoomState.Connected || notification.data.isLocal || !isSubscribing) {
        return;
      }

      const hasPeerHandRaised = vanillaStore.getState(selectHasPeerHandRaised(notification.data.id));
      const peer = vanillaStore.getState(selectPeerByID(notification.data.id));
      const handRaisedPeers = vanillaStore.getState(selectHandRaisedPeers);
      if (amIScreenSharing && hasPeerHandRaised) {
        const title = `${peer?.name} ${
          handRaisedPeers.length > 1 ? `and ${handRaisedPeers.length - 1} others` : ''
        } raised hand`;
        showNotification(title, { icon: logoURL });
      }
    },
    1000,
    [isSubscribing, notification, roomState, vanillaStore, amIScreenSharing],
  );
  return null;
};
