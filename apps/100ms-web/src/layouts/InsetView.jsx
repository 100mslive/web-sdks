import React, { Fragment } from "react";
import Draggable from "react-draggable";
import { useMedia } from "react-use";
import {
  selectAppData,
  selectLocalPeer,
  selectRemotePeers,
  selectRolesMap,
  selectTemplateAppData,
  useHMSStore,
} from "@100mslive/react-sdk";
import { Box, config as cssConfig, Flex } from "@100mslive/react-ui";
import { FirstPersonDisplay } from "../components/FirstPersonDisplay";
import VideoTile from "../components/VideoTile";
import { APP_DATA } from "../common/constants";

const getAspectRatio = ({ roleMap, roleName, isMobile }) => {
  console.log(roleName, roleMap);
  const role = roleMap[roleName];
  const { width, height } = role.publishParams.video;
  return isMobile ? height / width : width / height;
};

export function InsetView() {
  const remotePeers = useHMSStore(selectRemotePeers);
  const localPeer = useHMSStore(selectLocalPeer);
  const isMobile = useMedia(cssConfig.media.md);
  const roleMap = useHMSStore(selectRolesMap);
  const insetConfig = useHMSStore(selectTemplateAppData)?.inset?.[
    localPeer?.roleName
  ];
  let centerPeers = [];
  let sidepanePeers = [];
  if (insetConfig) {
    const center = insetConfig.center || [];
    const sidepane = insetConfig.sidepane || [];
    for (const peer of remotePeers) {
      if (center.includes(peer.roleName)) {
        centerPeers.push(peer);
      } else if (sidepane.includes(peer.roleName)) {
        sidepanePeers.push(peer);
      }
    }
  } else {
    centerPeers = remotePeers;
  }

  return (
    <Fragment>
      <Box
        css={{
          display: "grid",
          gridTemplateColumns: "auto 25%",
          gap: "$8",
          px: "$10",
          size: "100%",
        }}
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
          {centerPeers.length > 0 ? (
            centerPeers.map(peer => (
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
                objectFit="contain"
              />
            ))
          ) : (
            <FirstPersonDisplay />
          )}
        </Flex>
        <Flex
          align="center"
          justify="center"
          css={{
            size: "100%",
            gap: "$4",
            flexFlow: "row wrap",
          }}
        >
          {sidepanePeers.map(peer => (
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
                flex: "1 1 45%",
              }}
              objectFit="contain"
            />
          ))}
        </Flex>
      </Box>
      <InsetTile roleMap={roleMap} isMobile={isMobile} />
    </Fragment>
  );
}

const InsetTile = ({ isMobile, roleMap }) => {
  const localPeer = useHMSStore(selectLocalPeer);
  const sidepane = useHMSStore(selectAppData(APP_DATA.sidePane));

  return (
    <Draggable bounds="parent">
      <Box
        css={{
          position: "absolute",
          bottom: 0,
          right: sidepane ? "$100" : "$10",
          mr: sidepane ? "$14" : 0,
          boxShadow: "0 0 8px 0 rgba(0,0,0,0.3)",
          zIndex: 10,
          aspectRatio: getAspectRatio({
            roleMap,
            roleName: localPeer.roleName,
            isMobile,
          }),
          h: 180,
        }}
      >
        <VideoTile
          peerId={localPeer.id}
          trackid={localPeer.videoTrack}
          rootCSS={{
            size: "100%",
            padding: 0,
          }}
        />
      </Box>
    </Draggable>
  );
};
