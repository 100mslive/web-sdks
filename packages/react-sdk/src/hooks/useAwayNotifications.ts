// write a hook to use the MDN notifications API to show a notification when the user is away from the page
import { useCallback } from 'react';
import { selectLocalPeerRoleName } from '@100mslive/hms-video-store';
import { useHMSStore } from '../primitives/HmsRoomProvider';

// Do not prompt if preview is not available. Skips for beam
export const useAwayNotifications = () => {
  const localPeerRoleName = useHMSStore(selectLocalPeerRoleName);
  const requestPermission = useCallback(async () => {
    if (!Notification || Notification?.permission === 'granted' || localPeerRoleName === '__internal_recorder') {
      return;
    }
    await Notification.requestPermission();
  }, [localPeerRoleName]);

  const showNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (
      !Notification ||
      Notification?.permission === 'denied' ||
      /**
       * document.visibilityState is still 'visible' when the tab is active but window is not open
       * document.hasFocus() is false when the window is not active
       */
      (document.visibilityState === 'visible' && document.hasFocus())
    ) {
      return;
    }
    const notification = new Notification(title, options);

    const closeNotification = () => {
      if (document.visibilityState === 'visible' && document.hasFocus()) {
        notification?.close();
        document.removeEventListener('visibilitychange', closeNotification);
      }
    };
    document.addEventListener('visibilitychange', closeNotification);
  }, []);

  return { requestPermission, showNotification };
};
