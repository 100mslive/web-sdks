import { selectAppData, useHMSStore } from "@100mslive/react-sdk";
import { Box } from "@100mslive/react-ui";
import React from "react";
import { APP_DATA, SIDE_PANE_OPTIONS } from "../common/constants";
import { Chat } from "../components/Chat/Chat";
import { ParticipantList } from "../components/Header/ParticipantList";

const SidePane = () => {
  const sidepane = useHMSStore(selectAppData(APP_DATA.sidePane));
  const renderComponent = () => {
    switch (sidepane) {
      case SIDE_PANE_OPTIONS.PARTICIPANTS:
        return <ParticipantList />;
      case SIDE_PANE_OPTIONS.CHAT:
        return <Chat />;
      default:
        return null;
    }
  };
  if (!sidepane) {
    return null;
  }
  return <Box css={{ flexBasis: "$100" }}>{renderComponent()}</Box>;
};

export default SidePane;
