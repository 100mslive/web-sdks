import { usePDFScreenShare } from "@100mslive/react-sdk";
import { EmbedScreenShareView } from "./EmbedView";

/**
 * PDFComponent is responsible for rendering the PDF iframe and managing the screen sharing functionality.
 */
export const PDFView = () => {
  const { regionRef } = usePDFScreenShare();

  return <EmbedScreenShareView ref={regionRef} />;
};

export default PDFView;
