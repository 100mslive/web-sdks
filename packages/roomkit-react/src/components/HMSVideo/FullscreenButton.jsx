import React from "react";
import { Flex, IconButton, Tooltip } from "../base-components";

export const FullScreenButton = ({ isFullScreen, icon, onToggle }) => {
  return (
    <Tooltip title={`${isFullScreen ? "Exit" : "Go"} fullscreen`} side="top">
      <IconButton
        variant="standard"
        css={{ margin: "0px" }}
        onClick={onToggle}
        key="fullscreen_btn"
        data-testid="fullscreen_btn"
      >
        <Flex>{icon}</Flex>
      </IconButton>
    </Tooltip>
  );
};
