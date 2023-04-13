import React, { Fragment } from "react";
import Draggable from "react-draggable";
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
import { useRolePreference } from "../components/hooks/useFeatures";
import { APP_DATA } from "../common/constants";

const getAspectRatio = ({ roleMap, roleName, isMobile }) => {
  const role = roleMap[roleName];
  const { width, height } = role.publishParams.video;
  return isMobile ? height / width : width / height;
};

export function InsetView() {
  const remotePeers = useHMSStore(selectRemotePeers);
  const localPeer = useHMSStore(selectLocalPeer);
  const isMobile = useMedia(cssConfig.media.md);
  const isLandscape = useMedia(cssConfig.media.ls);
  const roleMap = useHMSStore(selectRolesMap);
  const rolePreference = useRolePreference();
  let centerPeers = [];
  let sidepanePeers = [];
  if (rolePreference) {
    const center = rolePreference[localPeer.roleName]?.split(",") || [];
    for (const peer of remotePeers) {
      if (center.includes(peer.roleName)) {
        centerPeers.push(peer);
      } else {
        sidepanePeers.push(peer);
      }
    }
  } else {
    centerPeers = remotePeers;
  }
  const hideInset = sidepanePeers.length > 0 && (isMobile || isLandscape);

  return (
    <Fragment>
      <Box
        css={{
          display: "grid",
          gridTemplateColumns: sidepanePeers.length > 0 ? "3fr 1fr" : "100%",
          gridTemplateRows: "1fr",
          gap: "$8",
          px: "$10",
          size: "100%",
          "@md": {
            gridTemplateColumns: "1fr",
            gridTemplateRows: sidepanePeers.length > 0 ? `3fr 1fr` : "100%",
          },
        }}
      >
        <Flex
          align="center"
          justify="center"
          css={{
            size: "100%",
            gap: "$8",
            flexWrap: "wrap",
            placeContent: "center",
            minHeight: 0,
            minWidth: 0,
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
        {sidepanePeers.length > 0 && (
          <Flex
            align="center"
            justify="center"
            css={{
              size: "100%",
              gap: "$4",
              flexFlow: "row wrap",
              placeContent: "center",
            }}
          >
            {(hideInset ? [...sidepanePeers, localPeer] : sidepanePeers).map(
              peer => (
                <VideoTile
                  key={peer.videoTrack || peer.id}
                  peerId={peer.id}
                  trackId={peer.videoTrack}
                  rootCSS={{
                    aspectRatio: getAspectRatio({
                      roleMap,
                      roleName: peer.roleName,
                      isMobile: false,
                    }),
                    flexBasis: "100%",
                    "@ls": {
                      aspectRatio: 1,
                      flexBasis: "45%",
                    },
                    "@md": {
                      aspectRatio: 1,
                      flexBasis: "45%",
                    },
                    padding: 0,
                  }}
                  objectFit="contain"
                />
              )
            )}
          </Flex>
        )}
      </Box>
      {!hideInset && <InsetTile roleMap={roleMap} isMobile={isMobile} />}
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
