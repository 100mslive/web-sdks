import React from "react";
import { selectAppData, useHMSStore } from "@100mslive/react-sdk";
import { Box } from "@100mslive/react-ui";
import { ParticipantList } from "../components/Header/ParticipantList";
import { APP_DATA, SIDE_PANE_OPTIONS } from "../common/constants";

const SidePane = ({ css = {} }) => {
  const sidepane = useHMSStore(selectAppData(APP_DATA.sidePane));
  let ViewComponent;
  if (sidepane === SIDE_PANE_OPTIONS.INTERACTIVITY) {
    ViewComponent = ParticipantList;
  }
  if (!ViewComponent) {
    return null;
  }
  return (
    <Box
      css={{
        position: "absolute",
        w: "$100",
        h: "100%",
        p: "$10",
        bg: "$surfaceDefault",
        r: "$1",
        top: 0,
        right: "$10",
        zIndex: 10,
        boxShadow: "$md",
        ...css,
        "@lg": {
          w: "100%",
          right: 0,
          position: "fixed",
          bottom: 0,
          height: "unset",
          ...(css["@lg"] || {}),
        },
      }}
    >
      <ViewComponent />
    </Box>
  );
};

export default SidePane;
