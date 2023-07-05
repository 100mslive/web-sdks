import { useCallback, useEffect, useRef, useState } from "react";
import { useIframeScreenShare } from "@100mslive/react-sdk";
import { Box, ThemeTypes, useTheme } from "@100mslive/react-ui";
import { EmbedScreenShareView } from "./EmbedView";
import { useSetAppDataByKey } from "../components/AppData/useUISettings";
import { APP_DATA } from "../common/constants";

/**
 * PDFView component is responsible for rendering the PDFEmbedComponent within an EmbedScreenShareView.
 * It manages the PDF configuration state and passes it to the PDFEmbedComponent as props.
 */
export const PDFView = () => {
  return (
    <EmbedScreenShareView>
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
        <PDFEmbedComponent />
      </Box>
    </EmbedScreenShareView>
  );
};

const usePDFConfig = () => {
  const [pdfConfig, setPDFConfig] = useSetAppDataByKey(APP_DATA.pdfConfig);
  let pdfIframeURL =
    process.env.REACT_APP_PDFJS_IFRAME_URL ||
    "https://pdf-annotation.100ms.live/generic/web/viewer.html";

  const resetPDFEmbedConfig = useCallback(() => {
    setPDFConfig({ isPDFBeingShared: false });
  }, [setPDFConfig]);

  // If a PDF URL is provided instead of a file, update the PDF iFrame URL with the URL parameter
  if (pdfConfig.url && !pdfConfig.file) {
    pdfIframeURL = pdfIframeURL + "?file=" + encodeURIComponent(pdfConfig.url);
  }

  return {
    pdfIframeURL,
    pdfFile: pdfConfig.file,
    resetPDFEmbedConfig,
  };
};

const sendDataToPDFIframe = (pdfIframeRef, themeType, file = null) => {
  if (pdfIframeRef.current) {
    pdfIframeRef.current.contentWindow.postMessage(
      {
        theme: themeType,
        file: file,
      },
      "*"
    );
  }
};

/**
 * PDFEmbedComponent is responsible for rendering the PDF iframe and managing the screen sharing functionality.
 */
export const PDFEmbedComponent = () => {
  const pdfIframeRef = useRef(null); // Create a ref to access the iframe element
  const themeType = useTheme().themeType; // Get the current theme type from the theme context
  const [isPDFLoaded, setIsPDFLoaded] = useState(false);
  const { pdfIframeURL, pdfFile, resetPDFEmbedConfig } = usePDFConfig();
  const {
    amIScreenSharing,
    wasScreenShared,
    stopScreenShare,
    startScreenShare,
  } = useIframeScreenShare(pdfIframeRef, resetPDFEmbedConfig);

  // Send theme information to the PDF iframe when theme is changed
  useEffect(() => {
    if (isPDFLoaded && pdfIframeRef.current) {
      sendDataToPDFIframe(pdfIframeRef, themeType === ThemeTypes.dark ? 2 : 1);
    }
  }, [isPDFLoaded, themeType]);

  // Start screen sharing when the component is mounted and not already screen sharing
  useEffect(() => {
    if (pdfIframeRef.current) {
      startScreenShare();
    }
  }, [startScreenShare]);

  useEffect(() => {
    // Reset embed configuration when screen sharing is stopped from anywhere
    if (wasScreenShared && !amIScreenSharing) {
      resetPDFEmbedConfig();
    }
    return () => {
      // close screenshare when this component is being unmounted
      if (wasScreenShared && amIScreenSharing) {
        resetPDFEmbedConfig();
        stopScreenShare(); // stop
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amIScreenSharing, resetPDFEmbedConfig, wasScreenShared]);

  return (
    <iframe
      src={pdfIframeURL}
      title="PDF Annotator"
      ref={pdfIframeRef}
      style={{
        width: "100%",
        height: "100%",
        border: 0,
        borderRadius: "0.75rem",
      }}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture fullscreen"
      referrerPolicy="no-referrer"
      onLoad={() => {
        if (pdfIframeRef.current && pdfFile) {
          // Set PDF theme on config change. Dark -> 2 and Light -> 1
          requestAnimationFrame(() => {
            sendDataToPDFIframe(
              pdfIframeRef,
              themeType === ThemeTypes.dark ? 2 : 1,
              pdfFile
            );
            setIsPDFLoaded(true);
          }, 1000);
        }
      }}
    />
  );
};

export default PDFView;
