import {
  useEmbedConfig,
  // useRegionCaptureScreenShare,s
} from "@100mslive/react-sdk";
import { EmbedScreenShareView } from "./EmbedView";

/**
 * PDFView component is responsible for rendering the PDFEmbedComponent within an EmbedScreenShareView.
 * It manages the PDF configuration state and passes it to the PDFEmbedComponent as props.
 */
export const PDFView = () => {
  return (
    <EmbedScreenShareView>
      <PDFEmbedComponent />
    </EmbedScreenShareView>
  );
};

/**
 * PDFEmbedComponent is responsible for rendering the PDF iframe and managing the screen sharing functionality.
 */
export const PDFEmbedComponent = () => {
  // const { regionRef } = useRegionCaptureScreenShare();
  const { regionRef } = useEmbedConfig();

  return (
    <iframe
      title="PDF Annotator"
      ref={regionRef}
      style={{
        width: "100%",
        height: "100%",
        border: 0,
        borderRadius: "0.75rem",
      }}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture fullscreen"
      referrerPolicy="no-referrer"
    />
  );
};

export default PDFView;
