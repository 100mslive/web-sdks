import { useEffect } from "react";
import {
  selectAppData,
  useHMSStore,
  usePDFAnnotator,
} from "@100mslive/react-sdk";
import { EmbedScreenShareView } from "./EmbedView";
import { APP_DATA } from "../common/constants";

/**
 * PDFView is responsible for rendering the PDF iframe and managing the screen sharing functionality.
 */
export const PDFView = () => {
  const { regionRef, startShare, amISharing } = usePDFAnnotator();
  const pdfConfig = useHMSStore(selectAppData(APP_DATA.pdfConfig));
  useEffect(() => {
    (async () => {
      if (pdfConfig?.data && !amISharing) {
        try {
          await startShare(pdfConfig.data);
        } catch (err) {
          console.log("error while sharing annotator ", err);
        }
      }
    })();
  }, [amISharing, pdfConfig, regionRef, startShare]);
  return <EmbedScreenShareView ref={regionRef} />;
};

export default PDFView;
