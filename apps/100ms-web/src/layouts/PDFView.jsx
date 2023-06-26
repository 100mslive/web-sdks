import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMedia } from "react-use";
import {
  selectLocalPeerID,
  selectLocalPeerRoleName,
  selectPeers,
  selectPeerScreenSharing,
  throwErrorHandler,
  useHMSStore,
  useScreenShare,
} from "@100mslive/react-sdk";
import {
  Box,
  config as cssConfig,
  Flex,
  ThemeTypes,
  useTheme,
} from "@100mslive/react-ui";
import { SidePane } from "./screenShareView";
import { useSetAppDataByKey } from "../components/AppData/useUISettings";
import { APP_DATA, isChrome } from "../common/constants";

export const PDFView = () => {
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
  }, [peers, peerPresenting, showPresenterInSmallTile]);
  return (
    <Flex
      css={{ size: "100%" }}
      direction={showSidebarInBottom ? "column" : "row"}
    >
      <PDFEmbedComponent />
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
};

export const PDFEmbedComponent = () => {
  const ref = useRef();
  const themeType = useTheme().themeType;
  const [isPDFLoaded, setIsPDFLoaded] = useState(false);
  let pdfJSURL = process.env.REACT_APP_PDFJS_IFRAME_URL;
  const { amIScreenSharing, toggleScreenShare } =
    useScreenShare(throwErrorHandler);
  const [pdfConfig, setPDFConfig] = useSetAppDataByKey(APP_DATA.pdfConfig);
  if (pdfConfig.url && !pdfConfig.file) {
    pdfJSURL = pdfJSURL + "?file=" + encodeURIComponent(pdfConfig.url);
  }
  const [wasScreenShared, setWasScreenShared] = useState(false);
  // to handle - https://github.com/facebook/react/issues/24502
  const screenShareAttemptInProgress = useRef(false);
  const iframeRef = useRef();

  const resetEmbedConfig = useCallback(() => {
    setPDFConfig({ state: false });
  }, [setPDFConfig]);
  useEffect(() => {
    if (isPDFLoaded && ref.current) {
      ref.current.contentWindow.postMessage(
        {
          theme: themeType === ThemeTypes.dark ? 2 : 1,
        },
        "*"
      );
    }
  }, [isPDFLoaded, themeType]);
  useEffect(() => {
    if (
      !amIScreenSharing &&
      !wasScreenShared &&
      !screenShareAttemptInProgress.current
    ) {
      screenShareAttemptInProgress.current = true;
      // start screenshare on load for others in the room to see
      toggleScreenShare({
        forceCurrentTab: isChrome,
        cropElement: iframeRef.current,
        preferCurrentTab: isChrome,
      })
        .then(() => {
          setWasScreenShared(true);
        })
        .catch(resetEmbedConfig)
        .finally(() => {
          screenShareAttemptInProgress.current = false;
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // reset embed when screenshare is closed from anywhere
    if (wasScreenShared && !amIScreenSharing) {
      resetEmbedConfig();
    }
    return () => {
      // close screenshare when this component is being unmounted
      if (wasScreenShared && amIScreenSharing) {
        resetEmbedConfig();
        toggleScreenShare(); // stop
      }
    };
  }, [wasScreenShared, amIScreenSharing, resetEmbedConfig, toggleScreenShare]);

  return (
    <Box
      ref={iframeRef}
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
        src={pdfJSURL}
        title="PDF Annotator"
        ref={ref}
        style={{
          width: "100%",
          height: "100%",
          border: 0,
          borderRadius: "0.75rem",
        }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture fullscreen"
        referrerPolicy="no-referrer"
        onLoad={() => {
          if (ref.current && pdfConfig.file) {
            // setting theme dark -> 2 and light -> 1
            requestAnimationFrame(() => {
              ref.current.contentWindow.postMessage(
                {
                  file: pdfConfig.file,
                  theme: themeType === ThemeTypes.dark ? 2 : 1,
                },
                "*"
              );
              setIsPDFLoaded(true);
            }, 1000);
          }
        }}
      />
    </Box>
  );
};

export default PDFView;
