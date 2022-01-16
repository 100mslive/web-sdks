// @ts-check
import {
  HMSNotificationTypes,
  selectBroadcastMessages,
  useHMSActions,
  useHMSNotifications,
  useHMSStore,
} from "@100mslive/hms-video-react";
import EventEmitter from "events";
import { useEffect, useState } from "react";
import { useWhiteboardMetadata } from "./useWhiteboardMetadata";

const whiteboardEmitter = new EventEmitter();

const stringifyWithNull = obj =>
  JSON.stringify(obj, (k, v) => (v === undefined ? null : v));

export const whiteboardLog = (...args) => console.log("Whiteboard", ...args);

const useWhiteboardMessages = () => {
  const messages = useHMSStore(selectBroadcastMessages);
  return messages
    .filter(message => message.type === "whiteboard")
    .map(message => ({ ...message, message: JSON.parse(message.message) }));
};

const usePeerJoinStateSync = () => {
  const [peerJoinCallback, setPeerJoinCallback] = useState(null);
  const { amIWhiteboardPeer } = useWhiteboardMetadata();
  const notification = useHMSNotifications();

  useEffect(() => {
    if (
      notification &&
      notification.type === HMSNotificationTypes.PEER_JOINED &&
      amIWhiteboardPeer &&
      typeof peerJoinCallback === "function"
    ) {
      peerJoinCallback();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notification, amIWhiteboardPeer]);

  return { peerJoinCallback, setPeerJoinCallback };
};

export const useRoom = () => {
  const hmsActions = useHMSActions();
  const messages = useWhiteboardMessages();
  const { peerJoinCallback, setPeerJoinCallback } = usePeerJoinStateSync();

  const lastMessage = messages[messages.length - 1];

  useEffect(() => {
    // When peerJoinCallback is set, we consider board has subcribed to all required events and is ready
    if (
      peerJoinCallback &&
      lastMessage &&
      lastMessage.message &&
      lastMessage.message.eventName
    ) {
      const newState = lastMessage.message;
      whiteboardEmitter.emit(newState.eventName, newState);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastMessage?.id, peerJoinCallback]);

  return {
    subscribe: (
      /** @type {string | symbol} */ eventName,
      /** @type {{ (...args: any[]): void; (...args: any[]): void; }} */ cb
    ) => {
      whiteboardEmitter.on(eventName, cb);
      return () => {
        whiteboardEmitter.off(eventName, cb);
      };
    },

    broadcastEvent: (/** @type {any} */ eventName, /** @type {any} */ arg) => {
      // whiteboardLog(
      //   "Broadcast event",
      //   arg,
      //   stringifyWithNull({ eventName, ...arg })
      // );
      hmsActions.sendBroadcastMessage(
        stringifyWithNull({ eventName, ...arg }),
        "whiteboard"
      );
    },
    setPeerJoinCallback,
  };
};
