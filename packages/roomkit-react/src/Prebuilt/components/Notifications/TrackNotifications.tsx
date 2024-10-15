import { useEffect } from 'react';
import { HMSNotificationTypes, useHMSNotifications } from '@100mslive/react-sdk';
// @ts-ignore: No implicit Any
import { ToastManager } from '../Toast/ToastManager';

const notificationTypes = [
  HMSNotificationTypes.TRACK_ADDED,
  HMSNotificationTypes.TRACK_REMOVED,
  HMSNotificationTypes.TRACK_MUTED,
  HMSNotificationTypes.TRACK_UNMUTED,
  HMSNotificationTypes.CHANGE_TRACK_STATE_REQUEST,
];

export const TrackNotifications = () => {
  const notification = useHMSNotifications(notificationTypes);
  useEffect(() => {
    if (notification) {
      switch (notification.type) {
        case HMSNotificationTypes.TRACK_ADDED:
        case HMSNotificationTypes.TRACK_REMOVED:
        case HMSNotificationTypes.TRACK_MUTED:
        case HMSNotificationTypes.TRACK_UNMUTED:
          console.debug(`[${notification.type}]`, notification);
          break;
        case HMSNotificationTypes.CHANGE_TRACK_STATE_REQUEST:
          {
            const track = notification.data?.track;
            if (!notification.data.enabled) {
              ToastManager.addToast({
                title: `Your ${track.source} ${track.type} was muted by
                  ${notification.data.requestedBy?.name}.`,
              });
            }
          }
          break;
      }
    }
  }, [notification]);

  return null;
};
