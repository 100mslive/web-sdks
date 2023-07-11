import { usePDFScreenShare } from "@100mslive/react-sdk";
import { EmbedScreenShareView } from "./EmbedView";

export const PDFView = () => {
  return (
    <EmbedScreenShareView>
      <PDFComponent />
    </EmbedScreenShareView>
  );
};
/**
 * EmbedComponent is responsible for rendering the PDF iframe and managing the screen sharing functionality.
 */
const PDFComponent = () => {
  const { regionRef } = usePDFScreenShare();

  return (
    <iframe
      title="PDF View"
      ref={regionRef}
      style={{
        width: "100%",
        height: "100%",
        border: 0,
        borderRadius: "0.75rem",
      }}
      allow="autoplay; clipboard-write;"
      referrerPolicy="no-referrer"
    />
  );
};

export default PDFView;
