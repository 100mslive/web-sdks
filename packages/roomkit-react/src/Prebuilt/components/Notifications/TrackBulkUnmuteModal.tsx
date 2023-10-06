import React, { useEffect, useState } from 'react';
import {
  HMSChangeMultiTrackStateRequest,
  HMSNotificationTypes,
  useHMSActions,
  useHMSNotifications,
} from '@100mslive/react-sdk';
import { MicOnIcon } from '@100mslive/react-icons';
// @ts-ignore: No implicit Any
import { RequestDialog } from '../../primitives/DialogContent';

export const TrackBulkUnmuteModal = () => {
  const hmsActions = useHMSActions();
  const [muteNotification, setMuteNotification] = useState<HMSChangeMultiTrackStateRequest | null>(null);
  const notification = useHMSNotifications([
    HMSNotificationTypes.CHANGE_MULTI_TRACK_STATE_REQUEST,
    HMSNotificationTypes.ROOM_ENDED,
    HMSNotificationTypes.REMOVED_FROM_ROOM,
  ]);

  useEffect(() => {
    switch (notification?.type) {
      case HMSNotificationTypes.REMOVED_FROM_ROOM:
      case HMSNotificationTypes.ROOM_ENDED:
        setMuteNotification(null);
        break;
      case HMSNotificationTypes.CHANGE_MULTI_TRACK_STATE_REQUEST:
        if (notification?.data.enabled) {
          setMuteNotification(notification.data);
        }
        break;
      default:
        return;
    }
  }, [notification]);

  if (!muteNotification) {
    return null;
  }

  const { requestedBy: peer, tracks, enabled } = muteNotification;

  return (
    <RequestDialog
      title="Track Unmute Request"
      body={`${peer?.name} has requested you to unmute your tracks.`}
      onOpenChange={(value: boolean) => !value && setMuteNotification(null)}
      onAction={() => {
        tracks.forEach(track => {
          hmsActions.setEnabledTrack(track.id, enabled);
        });
        setMuteNotification(null);
      }}
      Icon={MicOnIcon}
    />
  );
};
