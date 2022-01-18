// @ts-check
import {
  useHMSActions,
  useHMSVanillaNotifications,
  HMSNotificationTypes,
  useHMSStore,
  selectRoom,
} from "@100mslive/react-sdk";
import { useEffect, useMemo } from "react";

const stringifyWithNull = obj =>
  JSON.stringify(obj, (k, v) => (v === undefined ? null : v));

/**
 * @typedef ProviderInitOptions
 * @property {string} roomId
 * @property {import("@100mslive/hms-video-store").HMSActions} hmsActions
 * @property {import("@100mslive/hms-video-store").HMSNotifications} hmsNotifications
 */

/**
 * Base class which can be extended to use various realtime communication services.
 * Methods to broadcast and subscribe to events.
 *
 * Stores the last message received/broadcasted to resend when required(when board is ready)
 */
class BaseCommunicationProvider {
  constructor() {
    /** @private */
    this.lastMessage = {};
    /** @private */
    this.callbacks = {};
  }

  /**
   * @protected
   * @param {string} eventName
   * @param {any} message
   */
  setLastMessage = (eventName, message) => {
    this.lastMessage[eventName] = message;
  };

  /**
   * @protected
   * @param {string} eventName
   * @param {Function} cb
   */
  addCallback = (eventName, cb) => {
    if (!this.callbacks[eventName]) {
      this.callbacks[eventName] = [];
    }
    this.callbacks[eventName].push(cb);
  };

  /**
   * @param {string} eventName
   * @returns {any}
   */
  getLastMessage = eventName => {
    return this.lastMessage[eventName];
  };

  /**
   * @param {string} eventName
   * @param {Object} message
   */
  selfSendEvent = (eventName, message) => {
    if (this.callbacks[eventName]) {
      for (const cb of this.callbacks[eventName]) {
        cb(message);
      }
    }
  };

  /**
   * @param {string} eventName
   * @param {Object} message
   */
  broadcastEvent(eventName, message = {}) {
    this.setLastMessage(eventName, { eventName, ...message });

    /**
     * Tldraw thinks that the next update passed to replacePageContent after onChangePage is the own update triggered by onChangePage
     * and the replacePageContent doesn't have any effect if it is a valid update from remote.
     *
     * To overcome this own broadcast is sent to the app to use in replacePageContent.
     *
     * Refer: https://github.com/tldraw/tldraw/blob/main/packages/tldraw/src/state/TldrawApp.ts#L684
     */
    this.selfSendEvent(eventName, { eventName, ...message });
  }
}

class HMSCommunicationProvider extends BaseCommunicationProvider {
  constructor() {
    super();
    this.initialized = false;
  }

  /**
   * @param {ProviderInitOptions} options
   */
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
        notification.data?.type === "whiteboard" &&
        notification.data?.message
      ) {
        const message = notification.data?.message
          ? JSON.parse(notification.data?.message)
          : {};
        this.setLastMessage(message.eventName, message);
      }
    });
    this.initialized = true;
  };

  /**
   *
   * @param {string} eventName
   * @param {Object} arg
   */
  broadcastEvent = (eventName, arg = {}) => {
    super.broadcastEvent(eventName, arg);
    this.hmsActions.sendBroadcastMessage(
      stringifyWithNull({ eventName, ...arg }),
      "whiteboard"
    );
  };

  /**
   *
   * @param {string} eventName
   * @param {{ (...args: any[]): void; (...args: any[]): void; }} cb
   * @returns
   */
  subscribe = (eventName, cb) => {
    this.addCallback(eventName, cb);
    return this.hmsNotifications.onNotification(notification => {
      if (
        notification.type === HMSNotificationTypes.NEW_MESSAGE &&
        notification.data?.type === "whiteboard" &&
        notification.data?.message
      ) {
        const message = notification.data?.message
          ? JSON.parse(notification.data?.message)
          : {};
        if (message.eventName === eventName) {
          cb(message);
        }
      }
    });
  };
}

export const provider =
  process.env.REACT_APP_WHITEBOARD_COMMUNICATION_PROVIDER === "pusher"
    ? null
    : new HMSCommunicationProvider();

export const useCommunication = () => {
  const room = useHMSStore(selectRoom);
  const roomId = useMemo(() => room.id, [room]);
  const hmsActions = useHMSActions();
  const hmsNotifications = useHMSVanillaNotifications();

  useEffect(() => {
    if (roomId && hmsNotifications && hmsActions) {
      provider.init({
        roomId,
        hmsActions,
        hmsNotifications,
      });
    }
  }, [roomId, hmsNotifications, hmsActions]);

  return provider;
};
