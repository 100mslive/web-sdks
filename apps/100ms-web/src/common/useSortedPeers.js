import { useEffect, useState } from "react";
import { useHMSVanillaStore } from "@100mslive/react-sdk";
import PeersSorter from "./PeersSorter";

function useSortedPeers(peers, tilesPerPage, activeSpeakerSorting) {
  const [sortedPeers, setSortedPeers] = useState([]);
  const [peersSorter, setPeersSorter] = useState();
  const store = useHMSVanillaStore();
  useEffect(() => {
    setPeersSorter(new PeersSorter(store, setSortedPeers));
  }, [store]);

  useEffect(() => {
    if (tilesPerPage && peersSorter) {
      peersSorter.setPeersAndTilesPerPage({ peers, tilesPerPage });
    }
  }, [tilesPerPage, peersSorter, peers]);

  useEffect(() => {
    if (!activeSpeakerSorting && peersSorter) {
      peersSorter.stop();
    }
  }, [activeSpeakerSorting, peersSorter]);

  return sortedPeers;
}

export default useSortedPeers;
