import { useEffect } from 'react';
import {
  HMSNotificationTypes,
  HMSRoomState,
  selectHasPeerHandRaised,
  selectRoomState,
  useHMSNotifications,
  useHMSStore,
  useHMSVanillaStore,
} from '@100mslive/react-sdk';
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

  useEffect(() => {
    if (!notification?.data) {
      return;
    }

    // Don't show toast message in case of local peer.
    if (roomState !== HMSRoomState.Connected || notification.data.isLocal || !on_stage_exp || !isSubscribing) {
      return;
    }
    const hasPeerHandRaised = vanillaStore.getState(selectHasPeerHandRaised(notification.data.id));
    if (hasPeerHandRaised) {
      ToastBatcher.showToast({ notification, type: 'RAISE_HAND' });
      console.debug('Metadata updated', notification.data);
    }
  }, [isSubscribing, notification, on_stage_exp, roomState, vanillaStore]);

  return null;
};
