import { useCallback, useEffect, useRef, useState } from "react";
import { throwErrorHandler, useScreenShare } from "@100mslive/react-sdk";
import { Box, ThemeTypes, useTheme } from "@100mslive/react-ui";
import { EmbedScreenShareView } from "./EmbedView";
import { useSetAppDataByKey } from "../components/AppData/useUISettings";
import { APP_DATA, isChrome } from "../common/constants";

export const PDFView = () => {
  const [pdfConfig, setPDFConfig] = useSetAppDataByKey(APP_DATA.pdfConfig);
  return (
    <EmbedScreenShareView>
      <PDFEmbedComponent pdfConfig={pdfConfig} setPDFConfig={setPDFConfig} />
    </EmbedScreenShareView>
  );
};

export const PDFEmbedComponent = ({ pdfConfig, setPDFConfig }) => {
  const ref = useRef();
  const themeType = useTheme().themeType;
  const [isPDFLoaded, setIsPDFLoaded] = useState(false);
  let pdfJSURL = process.env.REACT_APP_PDFJS_IFRAME_URL;
  const { amIScreenSharing, toggleScreenShare } =
    useScreenShare(throwErrorHandler);
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

  const sendDataToPDFIframe = (themeType, file = null) => {
    if (ref.current) {
      ref.current.contentWindow.postMessage(
        {
          theme: themeType,
          file: file,
        },
        "*"
      );
    }
  };
  useEffect(() => {
    if (isPDFLoaded && ref.current) {
      sendDataToPDFIframe(themeType === ThemeTypes.dark ? 2 : 1);
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
              sendDataToPDFIframe(
                themeType === ThemeTypes.dark ? 2 : 1,
                pdfConfig.file
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
