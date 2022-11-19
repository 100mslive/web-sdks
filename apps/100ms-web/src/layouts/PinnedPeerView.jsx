import React from "react";
import { selectPeerByID, selectPeers, useHMSStore } from "@100mslive/react-sdk";
import { Flex } from "@100mslive/react-ui";
import { GridCenterView, GridSidePaneView } from "../components/gridView";
import { usePinnedPeerId } from "../components/AppData/useUISettings";

const PinnedPeerView = () => {
  const pinnedPeerId = usePinnedPeerId();
  const pinnedPeer = useHMSStore(selectPeerByID(pinnedPeerId));
  const peers = (useHMSStore(selectPeers) || []).filter(
    peer =>
      peer.videoTrack || peer.audioTrack || peer.auxiliaryTracks.length > 0
  );
  if (peers.length === 0) {
    return null;
  }
  const showSidePane = pinnedPeer && peers.length > 1;

  return (
    <Flex css={{ size: "100%", "@lg": { flexDirection: "column" } }}>
      <GridCenterView
        peers={[pinnedPeer]}
        maxTileCount={1}
        hideSidePane={!showSidePane}
      />
      {showSidePane && (
        <GridSidePaneView
          peers={peers.filter(peer => peer.id !== pinnedPeer.id)}
        />
      )}
    </Flex>
  );
};

export default PinnedPeerView;
