import React from "react";
import { useRecordingStreaming } from "@100mslive/react-sdk";
import { GoLiveIcon } from "@100mslive/react-icons";
import { SIDE_PANE_OPTIONS } from "./../common/constants";
import {
  useIsSidepaneTypeOpen,
  useSidepaneToggle,
} from "./AppData/useSidepane";
import {
  useIsHLSStartedFromUI,
  useIsRTMPStartedFromUI,
} from "./AppData/useUISettings";
import { Button, Tooltip } from "../base-components";

const GoLiveButton = () => {
  const isStreamingSidepaneOpen = useIsSidepaneTypeOpen(
    SIDE_PANE_OPTIONS.STREAMING
  );
  const toggleStreaming = useSidepaneToggle(SIDE_PANE_OPTIONS.STREAMING);
  const { isStreamingOn, isBrowserRecordingOn } = useRecordingStreaming();
  const isHLSStartedFromUI = useIsHLSStartedFromUI();
  const isRTMPStartedFromUI = useIsRTMPStartedFromUI();
  let tooltipText = "Start streaming";
  if (isHLSStartedFromUI || isRTMPStartedFromUI) {
    if (isHLSStartedFromUI) {
      tooltipText = "HLS start in progress";
    }
    if (isRTMPStartedFromUI) {
      tooltipText = "RTMP start in progress";
    }
  }
  return (
    <Tooltip title={tooltipText}>
      <Button
        data-testid="go_live"
        variant={isStreamingSidepaneOpen ? "standard" : "primary"}
        onClick={() => {
          toggleStreaming();
          window.sessionStorage.setItem("userStartedStream", "true");
        }}
        icon
        loading={isRTMPStartedFromUI || isHLSStartedFromUI}
        disabled={isBrowserRecordingOn && !isStreamingOn}
      >
        <GoLiveIcon />
        Go Live
      </Button>
    </Tooltip>
  );
};

export default GoLiveButton;
