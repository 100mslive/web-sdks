import { useEffect } from "react";
import { selectAppData, useHMSStore, usePDFShare } from "@100mslive/react-sdk";
import { ToastManager } from "../components/Toast/ToastManager";
import { EmbedScreenShareView } from "./EmbedView";
import { useResetPDFConfig } from "../components/AppData/useUISettings";
import { APP_DATA } from "../common/constants";

/**
 * PDFView is responsible for rendering the PDF iframe and managing the screen sharing functionality.
 */
export const PDFView = () => {
  const { iframeRef, startPDFShare, isPDFShareInProgress } = usePDFShare();
  const pdfConfig = useHMSStore(selectAppData(APP_DATA.pdfConfig));
  const resetConfig = useResetPDFConfig();

  useEffect(() => {
    (async () => {
      if (pdfConfig && !isPDFShareInProgress) {
        try {
          await startPDFShare(pdfConfig);
        } catch (err) {
          resetConfig();
          ToastManager.addToast({
            title: `Error while sharing annotator ${err.message || ""}`,
            variant: "error",
          });
        }
      }
    })();
  }, [isPDFShareInProgress, pdfConfig, iframeRef, resetConfig, startPDFShare]);
  return <EmbedScreenShareView ref={iframeRef} />;
};

export default PDFView;
