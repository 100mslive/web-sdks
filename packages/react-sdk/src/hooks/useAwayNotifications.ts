// write a hook to use the MDN notifications API to show a notification when the user is away from the page
import { useCallback } from 'react';
import { selectLocalPeerRoleName } from '@100mslive/hms-video-store';
import { useHMSVanillaStore } from '../primitives/HmsRoomProvider';

// Do not prompt if preview is not available. Skips for beam
export const useAwayNotifications = () => {
  const vanillaStore = useHMSVanillaStore();
  // eslint-disable-next-line complexity
  const requestPermission = useCallback(async () => {
    // Headless check for beam

    try {
      if (navigator.webdriver) {
        return;
      }
      if (!('Notification' in window)) {
        // Notifications not supported
        return;
      }

      console.log('###### Requesting Notification Permission !Notification');
      if (!Notification) {
        console.log('###### Requesting Notification exiting early');
        return;
      }

      console.log('###### will Request for Notification');
      if (Notification?.permission === 'granted' || Notification?.permission === 'denied') {
        console.log('###### Requesting Notification?.permission exiting early');
        return;
      }
      console.log('###### Requesting Notification Permission unsubscribe', Notification);
      const unsubscribe = vanillaStore.subscribe(async role => {
        if (role && role !== '__internal_recorder') {
          console.log('###### Requesting Notification now', Notification);
          await Notification?.requestPermission();
          unsubscribe?.();
        }
      }, selectLocalPeerRoleName);
      console.log('Requesting Notification Permission success', Notification);
    } catch (e) {
      console.log(e);
    }
  }, [vanillaStore]);

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
