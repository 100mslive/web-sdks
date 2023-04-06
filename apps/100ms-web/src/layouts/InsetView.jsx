import React from "react";
import { useMedia } from "react-use";
import {
  selectAppData,
  selectLocalPeer,
  selectRemotePeers,
  useHMSStore,
} from "@100mslive/react-sdk";
import { Box, config as cssConfig, Flex } from "@100mslive/react-ui";
import VideoTile from "../components/VideoTile";
import { APP_DATA } from "../common/constants";

export function InsetView() {
  const remotePeers = useHMSStore(selectRemotePeers);
  const localPeer = useHMSStore(selectLocalPeer);
  const sidepane = useHMSStore(selectAppData(APP_DATA.sidePane));
  const isMobile = useMedia(cssConfig.media.md);

  return (
    <Flex
      align="center"
      justify="center"
      css={{ position: "relative", size: "100%" }}
    >
      {remotePeers[0] && (
        <VideoTile
          peerId={remotePeers[0].id}
          trackId={remotePeers[0].videoTrack}
          css={{
            aspectRatio: isMobile ? 9 / 16 : 16 / 9,
            height: "100%",
            maxWidth: "100%",
          }}
          objectFit="contain"
        />
      )}
      <Box
        css={{
          position: "absolute",
          top: 0,
          right: sidepane ? "$100" : 0,
          mr: sidepane ? "$10" : 0,
          aspectRatio: isMobile ? 9 / 16 : 16 / 9,
          ...(isMobile ? { height: 180 } : { width: 320 }),
        }}
      >
        <VideoTile
          peerId={localPeer.id}
          trackid={localPeer.videoTrack}
          css={{ size: isMobile ? "100%" : undefined }}
        />
      </Box>
    </Flex>
  );
}
