import { useEffect, useRef, useState } from "react";
import { useHMSVanillaStore } from "@100mslive/react-sdk";
import PeersSorter from "./PeersSorter";
import { useActiveSpeakerSorting } from "../components/AppData/useUISettings";

function useSortedPeers({ peers, maxTileCount }) {
  const [sortedPeers, setSortedPeers] = useState([]);
  const store = useHMSVanillaStore();
  const activeSpeakerSorting = useActiveSpeakerSorting();
  const peerSortedRef = useRef(new PeersSorter(store, setSortedPeers));

  useEffect(() => {
    const peersSorter = peerSortedRef.current;
    if (
      peers?.length > 0 &&
      maxTileCount &&
      peersSorter &&
      activeSpeakerSorting
    ) {
      peersSorter.setPeersAndTilesPerPage({
        peers,
        tilesPerPage: maxTileCount,
      });
    } else if (peersSorter && !activeSpeakerSorting) {
      peersSorter.stop();
    }
  }, [maxTileCount, peers, activeSpeakerSorting]);

  return sortedPeers;
}

export default useSortedPeers;
