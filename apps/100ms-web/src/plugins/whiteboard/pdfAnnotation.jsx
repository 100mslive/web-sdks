import { useEffect, useRef } from "react";

export default function PdfViewerComponent(props) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    let PSPDFKit;
    (async function () {
      PSPDFKit = await import("pspdfkit");
      await PSPDFKit.load({
        // Container where PSPDFKit should be mounted.
        container,
        // The document to open.
        document: "sample.pdf",
        // Use the public directory URL as a base URL. PSPDFKit will download its library assets from here.
        baseUrl: `http://locahost:3000/`,
      });
    })();

    return () => PSPDFKit && PSPDFKit.unload(container);
  }, []);

  return <div ref={containerRef} style={{ width: "100%", height: "100vh" }} />;
}
