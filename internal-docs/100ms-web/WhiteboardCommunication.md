# HMS Communication Provider

Use the following class to use HMS Messaging for whiteboard communication.

```js
class HMSCommunicationProvider extends BaseCommunicationProvider {
  constructor() {
    super();
    /** @private */
    this.initialized = false;
  }

  init = ({ hmsActions, hmsNotifications }) => {
    if (this.initialized) {
      return;
    }

    /**
     * @private
     */
    this.hmsActions = hmsActions;
    /**
     * @private
     */
    this.hmsNotifications = hmsNotifications;

    this.hmsNotifications.onNotification(notification => {
      if (
        notification.type === HMSNotificationTypes.NEW_MESSAGE &&
        notification.data?.type === 'whiteboard' &&
        notification.data?.message
      ) {
        const message = notification.data?.message ? JSON.parse(notification.data?.message) : {};
        this.storeEvent(message.eventName, message);
      }
    });

    console.log('Whiteboard initialized communication through HMS Messaging');
    this.initialized = true;
  };

  /**
   * @param {string} eventName
   * @param {Object} arg
   */
  broadcastEvent = (eventName, arg = {}) => {
    super.broadcastEvent(eventName, arg);
    this.hmsActions.sendBroadcastMessage(stringifyWithNull({ eventName, ...arg }), 'whiteboard');
  };

  /**
   * @param {string} eventName
   * @param {Function} cb
   */
  subscribe = (eventName, cb) => {
    return this.hmsNotifications.onNotification(notification => {
      if (
        notification.type === HMSNotificationTypes.NEW_MESSAGE &&
        notification.data?.type === 'whiteboard' &&
        notification.data?.message
      ) {
        const message = notification.data?.message ? JSON.parse(notification.data?.message) : {};
        if (message.eventName === eventName) {
          cb(message);
        }
      }
    });
  };
}
```
