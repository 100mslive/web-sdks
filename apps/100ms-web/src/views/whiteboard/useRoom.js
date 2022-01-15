// @ts-check
import {
  selectBroadcastMessages,
  useHMSActions,
  useHMSStore,
} from "@100mslive/hms-video-react";
import EventEmitter from "events";
import { useEffect } from "react";

const whiteboardEmitter = new EventEmitter();

const stringifyWithNull = obj =>
  JSON.stringify(obj, (k, v) => (v === undefined ? null : v));

export const useWhiteboardMessages = () => {
  const messages = useHMSStore(selectBroadcastMessages);
  console.log("Whiteboard Messages", { messages });
  return messages
    .filter(message => message.type === "whiteboard")
    .map(message => ({ ...message, message: JSON.parse(message.message) }));
};

export const useRoom = () => {
  const hmsActions = useHMSActions();
  const messages = useWhiteboardMessages();

  const getBoardState = messages => {
    const lastMessage = messages.at(messages.length - 1);
    const state = lastMessage?.message;

    return {
      shapes: state?.shapes,
      bindings: state?.bindings,
    };
  };

  useEffect(() => {
    const newBoardState = getBoardState(messages);
    console.log(
      "Emitting",
      "shapeState",
      newBoardState.shapes,
      newBoardState.bindings
    );
    whiteboardEmitter.emit(
      "shapeState",
      newBoardState.shapes,
      newBoardState.bindings
    );
  }, [messages]);

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
      console.log(
        "Broadcast event",
        arg,
        stringifyWithNull({ eventName, ...arg })
      );
      hmsActions.sendBroadcastMessage(
        stringifyWithNull({ eventName, ...arg }),
        "whiteboard"
      );
    },

    getStorage: () => {
      const boardState = getBoardState(messages);
      return {
        root: new Map(
          Object.entries({
            shapes: new Map(Object.entries(boardState?.shapes || {})),
            bindings: new Map(Object.entries(boardState?.bindings || {})),
          })
        ),
      };
    },
  };
};
