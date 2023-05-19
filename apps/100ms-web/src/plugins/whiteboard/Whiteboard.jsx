import React from "react";
import { Tldraw } from "@tldraw/tldraw";
import { useMultiplayerState } from "./useMultiplayerState";
import "./Whiteboard.css";
import { Box } from "@100mslive/react-ui";

export const Whiteboard = React.memo(({ roomId }) => {
  const events = useMultiplayerState(roomId);

  return (
    <Box
      css={{
        "#TD-PrimaryTools-Image": {
          display: "none",
        },
      }}
    >
      <Tldraw
        autofocus
        disableAssets={true}
        showSponsorLink={false}
        showPages={false}
        showMenu={false}
        {...events}
      />
    </Box>
  );
});
