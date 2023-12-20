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

export const HandRaisedNotifications = () => {
  const notification = useHMSNotifications(HMSNotificationTypes.HAND_RAISE_CHANGED);
  const roomState = useHMSStore(selectRoomState);
  const vanillaStore = useHMSVanillaStore();
  const { on_stage_exp } = useRoomLayoutConferencingScreen().elements || {};

  useEffect(() => {
    if (!notification?.data) {
      return;
    }
    if (roomState !== HMSRoomState.Connected || notification.data.isLocal || !on_stage_exp) {
      return;
    }
    const hasPeerHandRaised = vanillaStore.getState(selectHasPeerHandRaised(notification.data.id));
    if (hasPeerHandRaised) {
      ToastBatcher.showToast({ notification, type: 'RAISE_HAND' });
    }
  }, [notification, on_stage_exp, roomState, vanillaStore]);

  return null;
};
