import { useCallback, useEffect, useRef, useState } from "react";
import {
  selectPeers,
  throwErrorHandler,
  useHMSStore,
  useScreenShare,
} from "@100mslive/react-sdk";
import { Box, Flex } from "@100mslive/react-ui";
import { GridSidePaneView } from "../components/gridView";
import { useSetAppDataByKey } from "../components/AppData/useUISettings";
import { APP_DATA } from "../common/constants";

export const PDFView = ({ showStats }) => {
  const peers = useHMSStore(selectPeers);

  return (
    <Flex css={{ size: "100%", "@lg": { flexDirection: "column" } }}>
      <EmbedComponent />
      <GridSidePaneView peers={peers} showStatsOnTiles={showStats} />
    </Flex>
  );
};

const EmbedComponent = () => {
  const ref = useRef();
  const { amIScreenSharing, toggleScreenShare } =
    useScreenShare(throwErrorHandler);
  const [pdfConfig, setPDFConfig] = useSetAppDataByKey(APP_DATA.pdfConfig);
  const [wasScreenShared, setWasScreenShared] = useState(false);
  // to handle - https://github.com/facebook/react/issues/24502
  const screenShareAttemptInProgress = useRef(false);
  const iframeRef = useRef();

  const resetEmbedConfig = useCallback(() => {
    setPDFConfig({ state: false });
  }, [setPDFConfig]);
  useEffect(() => {
    if (
      !amIScreenSharing &&
      !wasScreenShared &&
      !screenShareAttemptInProgress.current
    ) {
      screenShareAttemptInProgress.current = true;
      // start screenshare on load for others in the room to see
      toggleScreenShare({
        forceCurrentTab: true,
        cropElement: iframeRef.current,
        preferCurrentTab: true,
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
        src="https://pdf-js-git-feat-pdf-upload-100mslive.vercel.app/generic/web/viewer.html"
        title="PDF Annotator"
        ref={ref}
        style={{ width: "100%", height: "100%", border: 0 }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture fullscreen"
        referrerPolicy="no-referrer"
        onLoad={() => {
          if (ref.current) {
            setTimeout(() => {
              ref.current.contentWindow.postMessage(
                { file: pdfConfig.file },
                "*"
              );
            }, 1000);
          }
        }}
      />
    </Box>
  );
};

export default PDFView;
