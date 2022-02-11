// @ts-check
import { useContext } from "react";
import { AppContext } from "../../store/AppContext";
import { provider } from "./useCommunication";
import { useWhiteboardMetadata } from "./useWhiteboardMetadata";

export const whiteboardLog = (...args) => console.log("Whiteboard", ...args);

export const useRoom = () => {
  const { amIWhiteboardPeer } = useWhiteboardMetadata();
  const { didIJoinRecently } = useContext(AppContext);

  return {
    subscribe: provider.subscribe,
    broadcastEvent: provider.broadcastEvent,
    getStoredState: provider.getStoredEvent,
    storeEvent: provider.storeEvent,
    shouldRequestState: didIJoinRecently,
    amIWhiteboardPeer,
  };
};
