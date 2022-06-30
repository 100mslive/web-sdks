import React from "react";
import { selectAppData, useHMSStore } from "@100mslive/react-sdk";
import { Box } from "@100mslive/react-ui";
import { Chat } from "../components/Chat/Chat";
import { ParticipantList } from "../components/Header/ParticipantList";
import { APP_DATA, SIDE_PANE_OPTIONS } from "../common/constants";
import { StreamingLanding } from "../components/StreamingLanding";

const SidePane = () => {
  const sidepane = useHMSStore(selectAppData(APP_DATA.sidePane));
  let ViewComponent;
  if (sidepane === SIDE_PANE_OPTIONS.PARTICIPANTS) {
    ViewComponent = ParticipantList;
  } else if (sidepane === SIDE_PANE_OPTIONS.CHAT) {
    ViewComponent = Chat;
  } else if (sidepane === SIDE_PANE_OPTIONS.STREAMING) {
    ViewComponent = StreamingLanding;
  }
  if (!ViewComponent) {
    return null;
  }
  return (
    <Box css={{ flexBasis: "$100", position: "relative" }}>
      <ViewComponent />
    </Box>
  );
};

export default SidePane;
