// write a hook to use the MDN notifications API to show a notification when the user is away from the page
import { useCallback } from 'react';
import { selectLocalPeerRoleName } from '@100mslive/hms-video-store';
import { useHMSVanillaStore } from '../primitives/HmsRoomProvider';

// Do not prompt if preview is not available. Skips for beam
export const useAwayNotifications = () => {
  const vanillaStore = useHMSVanillaStore();
  const requestPermission = useCallback(async () => {
    // Headless check for beam
    if (!('Notification' in window) || navigator.webdriver) {
      console.debug('Request Permsissions : Notifications not supported or headless browser');
      // Notifications not supported
      return;
    }
    if (Notification?.permission === 'granted' || Notification?.permission === 'denied') {
      return;
    }
    const unsubscribe = vanillaStore.subscribe(async role => {
      if (role && role !== '__internal_recorder') {
        await Notification.requestPermission();
        unsubscribe?.();
      }
    }, selectLocalPeerRoleName);
  }, [vanillaStore]);

  const showNotification = useCallback((title: string, options?: NotificationOptions) => {
    // Notifications not supported
    if (!('Notification' in window)) {
      console.debug('Show Notifications: Notifications not supported or headless browser');
      return;
    }
    if (
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
