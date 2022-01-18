// @ts-check
import { provider } from "./useCommunication";
import { useWhiteboardMetadata } from "./useWhiteboardMetadata";

export const whiteboardLog = (...args) => console.log("Whiteboard", ...args);

export const useRoom = () => {
  const { amIWhiteboardPeer } = useWhiteboardMetadata();

  return {
    subscribe: provider.subscribe,
    broadcastEvent: provider.broadcastEvent,
    getStoredState: provider.getLastMessage,
    amIWhiteboardPeer,
  };
};
