import { forwardRef, useMemo } from "react";
import { useMedia } from "react-use";
import {
  selectLocalPeerID,
  selectLocalPeerRoleName,
  selectPeers,
  selectPeerScreenSharing,
  useEmbedScreenShare,
  useHMSStore,
} from "@100mslive/react-sdk";
import { Box, config as cssConfig, Flex } from "@100mslive/react-ui";
import { SidePane } from "./screenShareView";

/**
 * EmbedView is responsible for rendering the PDF iframe and managing the screen sharing functionality.
 */
export const EmbedView = () => {
  const { regionRef } = useEmbedScreenShare();
  console.log("region reff ", regionRef);
  return <EmbedScreenShareView ref={regionRef} />;
};

export const EmbedScreenShareView = forwardRef((props, ref) => {
  const peers = useHMSStore(selectPeers);

  const mediaQueryLg = cssConfig.media.xl;
  const showSidebarInBottom = useMedia(mediaQueryLg);
  const localPeerID = useHMSStore(selectLocalPeerID);
  const localPeerRole = useHMSStore(selectLocalPeerRoleName);
  const peerPresenting = useHMSStore(selectPeerScreenSharing);
  const isPresenterFromMyRole =
    peerPresenting?.roleName?.toLowerCase() === localPeerRole?.toLowerCase();
  const amIPresenting = localPeerID === peerPresenting?.id;
  const showPresenterInSmallTile =
    showSidebarInBottom || amIPresenting || isPresenterFromMyRole;

  const smallTilePeers = useMemo(() => {
    const smallTilePeers = peers.filter(peer => peer.id !== peerPresenting?.id);
    if (showPresenterInSmallTile && peerPresenting) {
      smallTilePeers.unshift(peerPresenting); // put presenter on first page
    }
    return smallTilePeers;
  }, [peers, showPresenterInSmallTile, peerPresenting]);
  return (
    <Flex
      css={{ size: "100%" }}
      direction={showSidebarInBottom ? "column" : "row"}
    >
      <Box
        css={{
          mx: "$8",
          flex: "3 1 0",
          "@lg": {
            flex: "2 1 0",
            display: "flex",
            alignItems: "center",
          },
        }}
      >
        <iframe
          title="Embed View"
          ref={ref}
          style={{
            width: "100%",
            height: "100%",
            border: 0,
            borderRadius: "0.75rem",
          }}
          allow="autoplay; clipboard-write;"
          referrerPolicy="no-referrer"
        />
      </Box>
      <Flex
        direction={{ "@initial": "column", "@lg": "row" }}
        css={{
          overflow: "hidden",
          p: "$4 $8",
          flex: "0 0 20%",
          "@xl": {
            flex: "1 1 0",
          },
        }}
      >
        <SidePane
          showSidebarInBottom={showSidebarInBottom}
          peerScreenSharing={peerPresenting}
          isPresenterInSmallTiles={showPresenterInSmallTile}
          smallTilePeers={smallTilePeers}
          totalPeers={peers.length}
        />
      </Flex>
    </Flex>
  );
});

export default EmbedView;
