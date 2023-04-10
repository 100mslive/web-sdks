import React from "react";
import { useMedia } from "react-use";
import {
  selectAppData,
  selectLocalPeer,
  selectRemotePeers,
  selectRolesMap,
  useHMSStore,
} from "@100mslive/react-sdk";
import { Box, config as cssConfig, Flex } from "@100mslive/react-ui";
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
      css={{ position: "relative", size: "100%" }}
    >
      <Flex align="center" justify="center" css={{ size: "100%" }}>
        {remotePeers.map(peer => (
          <VideoTile
            key={peer.videoTrack || peer.id}
            peerId={peer.id}
            trackId={peer.videoTrack}
            css={{
              aspectRatio: getAspectRatio({
                roleMap,
                roleName: peer.roleName,
                isMobile,
              }),
              height: "100%",
              maxWidth: "100%",
              minWidth: 0,
              display: "flex",
              alignItems: "center",
            }}
            objectFit="contain"
          />
        ))}
      </Flex>
      <Box
        css={{
          position: "absolute",
          bottom: 0,
          right: sidepane ? "$100" : "$8",
          mr: sidepane ? "$10" : 0,
          zIndex: 11,
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
          css={
            isMobile
              ? {
                  size: "100%",
                  padding: 0,
                }
              : undefined
          }
        />
      </Box>
    </Flex>
  );
}
