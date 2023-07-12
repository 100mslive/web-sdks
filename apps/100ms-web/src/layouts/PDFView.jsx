import { useEffect } from "react";
import {
  selectAppData,
  useHMSStore,
  usePDFAnnotator,
} from "@100mslive/react-sdk";
import { ToastManager } from "../components/Toast/ToastManager";
import { EmbedScreenShareView } from "./EmbedView";
import { useResetPDFConfig } from "../components/AppData/useUISettings";
import { APP_DATA } from "../common/constants";

/**
 * PDFView is responsible for rendering the PDF iframe and managing the screen sharing functionality.
 */
export const PDFView = () => {
  const { regionRef, startShare, amISharing } = usePDFAnnotator();
  const pdfConfig = useHMSStore(selectAppData(APP_DATA.pdfConfig));
  const resetConfig = useResetPDFConfig();

  useEffect(() => {
    (async () => {
      if (pdfConfig && !amISharing) {
        try {
          await startShare(pdfConfig);
        } catch (err) {
          resetConfig();
          ToastManager.addToast({
            title: `Error while sharing annotator ${err.message || ""}`,
            variant: "error",
          });
        }
      }
    })();
  }, [amISharing, pdfConfig, regionRef, resetConfig, startShare]);
  return <EmbedScreenShareView ref={regionRef} />;
};

export default PDFView;
