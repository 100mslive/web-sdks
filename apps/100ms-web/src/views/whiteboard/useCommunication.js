// @ts-check
import {
  useHMSActions,
  useHMSVanillaNotifications,
  HMSNotificationTypes,
  useHMSStore,
  selectRoom,
} from "@100mslive/react-sdk";
import { useEffect, useMemo } from "react";
import Pusher from "pusher-js";

const stringifyWithNull = obj =>
  JSON.stringify(obj, (k, v) => (v === undefined ? null : v));

/**
 * @typedef ProviderInitOptions
 * @property {string} roomId
 * @property {import("@100mslive/hms-video-store").HMSActions} hmsActions
 * @property {import("@100mslive/hms-video-store").HMSNotifications} hmsNotifications
 */

/**
 * On whiteboard close, owner sends current state to remote peers.
 * Remote peers tear down too quickly(unsubscribing listeners) and are unable to store the last state.
 *
 * Hack: To overcome this, attach 2 listeners:
 * one for storing the message(won't be unsubscribed),
 * one for calling the actual whiteboard callback(will be unsubscribed on whiteboard close)
 *
 * This way the last state is always received and stored
 */

/**
 * Base class which can be extended to use various realtime communication services.
 * Methods to broadcast and subscribe to events.
 *
 * Stores the last message received/broadcasted to resend when required(when board is ready)
 */
class BaseCommunicationProvider {
  constructor() {
    /** @protected */
    this.lastMessage = {};
  }

  /**
   * @protected
   * @param {string} eventName
   * @param {any} message
   */
  storeEvent = (eventName, message) => {
    console.log("Whiteboard storing", { eventName, message });
    this.lastMessage[eventName] = message;
  };

  /**
   * @param {string} eventName
   * @returns {any}
   */
  getStoredEvent = eventName => {
    return this.lastMessage[eventName];
  };

  /**
   * @param {string} eventName
   * @param {Object} message
   */
  broadcastEvent(eventName, message = {}) {
    this.storeEvent(eventName, { eventName, ...message });
  }
}

class HMSCommunicationProvider extends BaseCommunicationProvider {
  constructor() {
    super();
    /** @private */
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
        this.storeEvent(message.eventName, message);
      }
    });

    console.log("Whiteboard initialized communication through HMS Messaging");
    this.initialized = true;
  };

  /**
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
   * @param {string} eventName
   * @param {Function} cb
   */
  subscribe = (eventName, cb) => {
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

class PusherCommunicationProvider extends BaseCommunicationProvider {
  constructor() {
    super();
    /** @private */
    this.initialized = false;
  }

  /**
   * @param {ProviderInitOptions} options
   */
  init = ({ roomId }) => {
    if (this.initialized) {
      return;
    }

    Pusher.logToConsole = true;

    /** @private */
    this.pusher = new Pusher(process.env.REACT_APP_PUSHER_APP_KEY, {
      cluster: "ap2",
      authEndpoint: "http://localhost:5001/api/pusher/auth",
    });

    /** @private */
    this.channel = this.pusher.subscribe(`private-${roomId}`);

    /**
     * When events(peer-join) are sent too early before subscribing to a channel,
     * resend last event after subscription has succeeded.
     */
    this.channel.bind("pusher:subscription_succeeded", this.resendLastEvents);

    console.log("Whiteboard initialized communication through Pusher");
    this.initialized = true;
  };

  /**
   * @param {string} eventName
   * @param {Object} arg
   */
  broadcastEvent = (eventName, arg = {}) => {
    super.broadcastEvent(eventName, arg);
    this.channel.trigger(
      `client-${eventName}`,
      stringifyWithNull({ eventName, ...arg })
    );
  };

  /**
   *
   * @param {string} eventName
   * @param {Function} cb
   */
  subscribe = (eventName, cb) => {
    this.channel.bind(`client-${eventName}`, message =>
      this.storeEvent(eventName, message)
    );
    this.channel.bind(`client-${eventName}`, cb);
    return () => {
      this.channel.unbind(`client-${eventName}`, cb);
    };
  };

  resendLastEvents = () => {
    for (const eventName in this.lastMessage) {
      if (this.lastMessage[eventName]) {
        console.log("Pusher Resending", eventName, this.lastMessage[eventName]);
        this.channel.trigger(
          `client-${eventName}`,
          this.lastMessage[eventName]
        );
      }
    }
  };
}

export const provider =
  process.env.REACT_APP_WHITEBOARD_COMMUNICATION_PROVIDER === "pusher" &&
  process.env.REACT_APP_PUSHER_APP_KEY
    ? new PusherCommunicationProvider()
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
