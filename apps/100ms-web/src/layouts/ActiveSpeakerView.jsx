import React, { useRef } from "react";
import {
  selectPeers,
  useHMSStore,
  selectDominantSpeaker,
  selectLocalPeer,
  selectRemotePeers,
} from "@100mslive/react-sdk";
import { Flex } from "@100mslive/react-ui";
import { GridCenterView, GridSidePaneView } from "../components/gridView";
import { useIsHeadless } from "../components/AppData/useUISettings";

const ActiveSpeakerView = () => {
  const localPeer = useHMSStore(selectLocalPeer);
  const dominantSpeaker = useHMSStore(selectDominantSpeaker);
  const latestDominantSpeakerRef = useRef(dominantSpeaker);
  const isHeadless = useIsHeadless();
  const peers = useHMSStore(isHeadless ? selectRemotePeers : selectPeers);
  // if there is no current dominant speaker latest keeps pointing to last
  if (dominantSpeaker) {
    latestDominantSpeakerRef.current = dominantSpeaker;
  }
  // show local peer if there hasn't been any dominant speaker
  const activeSpeaker =
    latestDominantSpeakerRef.current ||
    (isHeadless && peers.length > 0 ? peers[0] : localPeer);
  const showSidePane = activeSpeaker && peers.length > 1;

  return (
    <Flex css={{ size: "100%", "@lg": { flexDirection: "column" } }}>
      <GridCenterView
        peers={[activeSpeaker]}
        maxTileCount={1}
        hideSidePane={!showSidePane}
      />
      {showSidePane && (
        <GridSidePaneView
          peers={peers.filter(peer => peer.id !== activeSpeaker.id)}
        />
      )}
    </Flex>
  );
};

export default ActiveSpeakerView;
