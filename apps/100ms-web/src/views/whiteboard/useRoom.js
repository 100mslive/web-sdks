// @ts-check
import {
  HMSNotificationTypes,
  useHMSNotifications,
} from "@100mslive/hms-video-react";
import { useEffect, useState } from "react";
import { provider } from "./useCommunication";
import { useWhiteboardMetadata } from "./useWhiteboardMetadata";

export const whiteboardLog = (...args) => console.log("Whiteboard", ...args);

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

  useEffect(() => {
    if (peerJoinCallback && amIWhiteboardPeer) {
      window.addEventListener("beforeunload", peerJoinCallback);

      return () => {
        // On close, send current state to retrieve on next open
        window.removeEventListener("beforeunload", peerJoinCallback);
        peerJoinCallback();
      };
    }
  }, [peerJoinCallback, amIWhiteboardPeer]);

  useEffect(() => {
    if (peerJoinCallback) {
      // On open, check and update the last whole state message received(in store)
      provider.resendLastMessage("currentState");
    }
  }, [peerJoinCallback]);

  return { peerJoinCallback, setPeerJoinCallback };
};

export const useRoom = () => {
  const { setPeerJoinCallback } = usePeerJoinStateSync();

  return {
    subscribe: provider.subscribe,
    broadcastEvent: provider.broadcastEvent,
    setPeerJoinCallback,
  };
};
