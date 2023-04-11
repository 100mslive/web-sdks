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
import { FirstPersonDisplay } from "../components/FirstPersonDisplay";
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
        css={{
          size: "100%",
          gap: "$4",
          flexFlow: "row wrap",
          "@lg": { flexFlow: "column" },
          "@ls": { flexFlow: "row" },
        }}
      >
        {remotePeers.length > 0 ? (
          remotePeers.map(peer => (
            <VideoTile
              key={peer.videoTrack || peer.id}
              peerId={peer.id}
              trackId={peer.videoTrack}
              rootCSS={{
                aspectRatio: getAspectRatio({
                  roleMap,
                  roleName: peer.roleName,
                  isMobile,
                }),
                padding: 0,
                height: "100%",
                maxWidth: "100%",
                minWidth: 0,
                flex: remotePeers.length === 1 ? undefined : "1 1 0",
                display: "flex",
                alignItems: "center",
                "@lg": {
                  display: "block",
                  padding: "0 !important",
                  width: "100%",
                },
              }}
              containerCSS={{
                height: "unset",
                "@lg": {
                  height: "100%",
                },
                "@ls": {
                  height: "100%",
                },
              }}
              objectFit="contain"
            />
          ))
        ) : (
          <FirstPersonDisplay />
        )}
      </Flex>
      <Box
        css={{
          position: "absolute",
          bottom: remotePeers.length === 0 ? 0 : "$16",
          right: sidepane ? "$100" : "$10",
          mr: sidepane ? "$14" : 0,
          boxShadow: "0 0 8px 0 rgba(0,0,0,0.3)",
          zIndex: 10,
          aspectRatio: getAspectRatio({
            roleMap,
            roleName: localPeer.roleName,
            isMobile,
          }),
          w: 320,
          "@ls": {
            w: 240,
          },
          "@md": {
            h: 240,
            w: "auto",
          },
        }}
      >
        <VideoTile
          peerId={localPeer.id}
          trackid={localPeer.videoTrack}
          rootCSS={{
            height: isMobile ? "100%" : undefined,
            padding: 0,
          }}
        />
      </Box>
    </Flex>
  );
}
