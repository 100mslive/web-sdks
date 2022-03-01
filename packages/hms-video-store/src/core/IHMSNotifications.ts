import { HMSNotification, HMSNotificationTypes } from './schema/notification';

export type HMSNotificationCallback = (notification: HMSNotification) => void;

/**
 * @category Core
 */
export interface IHMSNotifications {
  /**
   * you can subscribe to notifications for new message, peer add etc. using this function.
   * note that this is not meant to maintain any state on your side, as the reactive store already
   * does that. The intent of this function is mainly to display toast notifications or send analytics.
   * We'll provide a display message which can be displayed as it is for common cases.
   */
  onNotification: (cb: HMSNotificationCallback, type?: HMSNotificationTypes | HMSNotificationTypes[]) => () => void;
}
