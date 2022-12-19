import React, { useEffect, useState } from "react";
import {
  selectIsAllowedToPublish,
  selectLocalPeerID,
  selectLocalPeerRole,
  selectPeers,
  selectPeersByRoles,
  useHMSStore,
} from "@100mslive/react-sdk";
import { Flex } from "@100mslive/react-ui";
import { GridCenterView, GridSidePaneView } from "../components/gridView";
import { NonPublisherView } from "./NonPublisherView";
import { useAppLayout } from "../components/AppData/useAppLayout";
import { useUISettings } from "../components/AppData/useUISettings";
import { UI_SETTINGS } from "../common/constants";

export const MainGridView = () => {
  const centerRoles = useAppLayout("center") || [];
  const sidepaneRoles = useAppLayout("sidepane") || [];
  const maxTileCount = useUISettings(UI_SETTINGS.maxTileCount);
  const peers = useHMSStore(selectPeers);
  const localPeerId = useHMSStore(selectLocalPeerID);
  const centerPeers = peers.filter(peer => centerRoles.includes(peer.roleName));
  const isAllowedToPublish = useHMSStore(selectIsAllowedToPublish);
  const sidebarPeers = peers.filter(peer =>
    sidepaneRoles.includes(peer.roleName)
  );
  const localRole = useHMSStore(selectLocalPeerRole);
  const peersByRoles = useHMSStore(
    selectPeersByRoles(localRole.subscribeParams.subscribeToRoles || [])
  );
  const [isRolesWithPublisher, setRolesWithPublisher] = useState(false);
  const [isRoleSubscribing, setRoleSubscribing] = useState(false);
  const [isRoleSubscribingPublish, setRoleSubscribingPublish] = useState(false);
  useEffect(() => {
    const publishingPeers = peers.filter(
      peer =>
        peer?.audioTrack ||
        peer?.videoTrack ||
        (peer?.auxiliaryTracks && peer?.auxiliaryTracks.length > 0)
    );
    console.log(peers);
    setRolesWithPublisher(publishingPeers.length > 0);
  }, [peers, setRolesWithPublisher]);

  useEffect(
    () =>
      setRoleSubscribing(
        localRole.subscribeParams.subscribeToRoles?.length > 0
      ),
    [localRole, setRoleSubscribing]
  );

  useEffect(() => {
    const publishingPeers = peersByRoles.filter(
      peer =>
        peer?.audioTrack ||
        peer?.videoTrack ||
        (peer?.auxiliaryTracks && peer?.auxiliaryTracks.length > 0)
    );
    setRoleSubscribingPublish(publishingPeers.length > 0);
  }, [peersByRoles, setRoleSubscribingPublish]);
  /**
   * If there are peers from many publishing roles, then it's possible to divide
   * them into two parts, those who show in center and those who show in sidepane.
   * In case there is only one person in the room, then too sidepane will be shown
   * and center would be taken up by a banner image.
   * There is an issue currently, where the banner is still shown if there are
   * multiple viewers in the room but no publisher. Depending on the use case
   * this can be useful(for webinar) or look odd(for showing you're the only one).
   * Note that both center peers and sidebar peers have only publishing peers in them.
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

  console.log(
    "is allowed to pulbisj ",
    isAllowedToPublish,
    sidebarPeers,
    peers,
    isRolesWithPublisher,
    isRoleSubscribing,
    isRoleSubscribingPublish
  );
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
      {!isRolesWithPublisher ? (
        <NonPublisherView message="None of the roles can publish video, audio or screen" />
      ) : !isRoleSubscribing ? (
        <NonPublisherView message="This role isn't subscribed to any role" />
      ) : !isRoleSubscribingPublish ? (
        <NonPublisherView message="This role subscribed to roles is not publishing" />
      ) : (
        <>
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
        </>
      )}
    </Flex>
  );
};
