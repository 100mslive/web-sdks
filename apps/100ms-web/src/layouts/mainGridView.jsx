import React from "react";
import {
  selectLocalPeerID,
  selectPeers,
  useHMSStore,
} from "@100mslive/react-sdk";
import { Flex } from "@100mslive/react-ui";
import { GridCenterView, GridSidePaneView } from "../components/gridView";
import { useUISettings } from "../components/AppData/useUISettings";
import { useAppLayout } from "../components/AppData/useAppLayout";
import { UI_SETTINGS } from "../common/constants";

export const MainGridView = () => {
  const centerRoles = useAppLayout("center") || [];
  const sidepaneRoles = useAppLayout("sidepane") || [];
  const maxTileCount = useUISettings(UI_SETTINGS.maxTileCount);
  const peers = useHMSStore(selectPeers);
  const localPeerId = useHMSStore(selectLocalPeerID);
  const centerPeers = peers.filter(
    peer => !!peer.videoTrack && centerRoles.includes(peer.roleName)
  );
  const sidebarPeers = peers.filter(peer =>
    sidepaneRoles.includes(peer.roleName)
  );

  /**
   * If there are peers from many publishing roles, then it's possible to divide
   * them into two parts, those who show in center and those who show in sidepane.
   * In case there is only one person in the room, then too sidepane will be shown
   * and center would be taken up by a banner image.
   *
   * In Addition, Peers with non-publishing and non-subscribed roles are prohibited from appearing
   * in center view.
   */
  let showSidePane = centerPeers.length > 0 && sidebarPeers.length > 0;
  if (centerPeers.length === 0) {
    // we'll show the sidepane for banner in this case too if 1). it's only me
    // in the room. or 2). noone is publishing in the room
    const itsOnlyMeInTheRoom =
      peers.length === 1 && peers[0].id === localPeerId;
    const nooneIsPublishing = sidebarPeers.length === 0;
    showSidePane = itsOnlyMeInTheRoom || nooneIsPublishing;
  }

  return (
    <Flex
      css={{
        size: "100%",
      }}
      direction={{
        "@initial": "row",
        "@md": "column",
      }}
    >
      <GridCenterView
        peers={showSidePane ? centerPeers : peers}
        maxTileCount={maxTileCount}
        allowRemoteMute={false}
        hideSidePane={!showSidePane}
        totalPeers={peers.length}
      />
      {showSidePane && (
        <GridSidePaneView peers={sidebarPeers} totalPeers={peers.length} />
      )}
    </Flex>
  );
};
