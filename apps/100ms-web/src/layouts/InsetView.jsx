import React from "react";
import { useMedia } from "react-use";
import {
  selectAppData,
  selectLocalPeer,
  selectRemotePeers,
  selectRolesMap,
  useHMSStore,
} from "@100mslive/react-sdk";
import { Box, config as cssConfig, css, Flex } from "@100mslive/react-ui";
import VideoTile from "../components/VideoTile";
import { APP_DATA } from "../common/constants";

const getAspectRatio = ({ roleMap, roleName, isMobile }) => {
  const role = roleMap[roleName];
  const { width, height } = role.publishParams.video;
  return isMobile ? height / width : width / height;
};

export function InsetView() {
  const remotePeers = useHMSStore(selectRemotePeers);
  const localPeer = useHMSStore(selectLocalPeer);
  const sidepane = useHMSStore(selectAppData(APP_DATA.sidePane));
  const isMobile = useMedia(cssConfig.media.md);
  const roleMap = useHMSStore(selectRolesMap);

  return (
    <Flex
      align="center"
      justify="center"
      css={{ position: "relative", size: "100%", px: "$10" }}
    >
      <Flex
        align="center"
        justify="center"
        css={{ size: "100%", gap: "$2", flexFlow: "row wrap" }}
      >
        {remotePeers.map(peer => (
          <VideoTile
            key={peer.videoTrack || peer.id}
            peerId={peer.id}
            trackId={peer.videoTrack}
            rootClassName={css({
              aspectRatio: getAspectRatio({
                roleMap,
                roleName: peer.roleName,
                isMobile,
              }),
              padding: 0,
              height: "100%",
              maxWidth: "100%",
              minWidth: 0,
            })()}
            objectFit="contain"
          />
        ))}
      </Flex>
      <Box
        css={{
          position: "absolute",
          bottom: "$16",
          right: sidepane ? "$100" : "$10",
          mr: sidepane ? "$14" : 0,
          aspectRatio: getAspectRatio({
            roleMap,
            roleName: localPeer.roleName,
            isMobile,
          }),
          ...(isMobile ? { height: 240 } : { width: 320 }),
        }}
      >
        <VideoTile
          peerId={localPeer.id}
          trackid={localPeer.videoTrack}
          css={{ p: 0 }}
          rootClassName={css({
            height: isMobile ? "100%" : undefined,
            padding: 0,
          })()}
        />
      </Box>
    </Flex>
  );
}
