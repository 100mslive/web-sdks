import React from "react";
import { Tldraw } from "@tldraw/tldraw";
import PdfViewerComponent from "./pdfAnnotation";
import { useMultiplayerState } from "./useMultiplayerState";
import "./Whiteboard.css";

export const Whiteboard = React.memo(({ roomId }) => {
  const events = useMultiplayerState(roomId);
  const isPdf = true;
  return isPdf ? (
    <PdfViewerComponent />
  ) : (
    <Tldraw
      autofocus
      disableAssets={true}
      showSponsorLink={false}
      showPages={false}
      showMenu={false}
      {...events}
    />
  );
});
