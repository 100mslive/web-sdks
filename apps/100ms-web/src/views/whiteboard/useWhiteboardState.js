import { createSelector } from "reselect";
import {
  useHMSActions,
  useHMSStore,
  selectLocalPeerID,
  selectPeersMap,
  selectPeerMetadata,
} from "@100mslive/hms-video-react";
import { useCallback, useMemo } from "react";

const getPeerMetaData = peer =>
  peer?.metadata && peer.metadata !== "" ? JSON.parse(peer.metadata) : {};

const selectWhiteboardPeer = createSelector(selectPeersMap, peersMap => {
  for (const peerID in peersMap) {
    const peer = peersMap[peerID];
    if (getPeerMetaData(peer).whiteboardEnabled) {
      return peer;
    }
  }
  return undefined;
});

export const useWhiteboardState = () => {
  const hmsActions = useHMSActions();
  const localPeerID = useHMSStore(selectLocalPeerID);
  const metadata = useHMSStore(selectPeerMetadata(localPeerID));
  const whiteboardPeer = useHMSStore(selectWhiteboardPeer);
  const amIWhiteboardPeer = useMemo(
    () => localPeerID === whiteboardPeer?.id,
    [localPeerID, whiteboardPeer]
  );

  /**
   * @param enabled {boolean}
   */
  const setWhiteboardEnabled = useCallback(
    async enabled => {
      try {
        if (!whiteboardPeer || amIWhiteboardPeer) {
          await hmsActions.changeMetadata({
            ...metadata,
            whiteboardEnabled: enabled,
          });
        } else {
          console.warn(
            "Cannot toggle whiteboard as it was shared by another peer"
          );
        }
      } catch (error) {
        console.error("failed to set whiteboardEnabled", error);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hmsActions]
  );
  window.setWhiteboardEnabled = setWhiteboardEnabled;
  return { whiteboardPeer, amIWhiteboardPeer, setWhiteboardEnabled };
};
