// write a hook to use the MDN notifications API to show a notification when the user is away from the page
import { useCallback } from 'react';

export const useAwayNotifications = () => {
  const requestPermission = useCallback(async () => {
    if (!Notification || Notification?.permission === 'granted') {
      return;
    }
    await Notification.requestPermission();
  }, []);

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
