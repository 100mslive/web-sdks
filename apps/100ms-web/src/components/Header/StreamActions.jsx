import { Fragment } from "react";
import {
  selectIsAllowedToPublish,
  selectIsConnectedToRoom,
  selectPermissions,
  useHMSStore,
  useRecordingStreaming,
} from "@100mslive/react-sdk";
import { EndStreamIcon, RecordIcon } from "@100mslive/react-icons";
import { Box, Button, Flex, Text, Tooltip } from "@100mslive/react-ui";
import GoLiveButton from "../GoLiveButton";
import { useSidepaneToggle } from "../AppData/useSidepane";
import { SIDE_PANE_OPTIONS } from "../../common/constants";

const EndStream = () => {
  const { isHLSRecordingOn, isHLSRunning, isRTMPRunning } =
    useRecordingStreaming();
  const toggleStreaming = useSidepaneToggle(SIDE_PANE_OPTIONS.STREAMING);
  if (!isHLSRunning && !isRTMPRunning) {
    return null;
  }
  return (
    <Flex align="center" css={{ ml: "$4" }}>
      <Box css={{ w: "$4", h: "$4", r: "$round", bg: "$error", mr: "$4" }} />
      <Text>Live with HLS</Text>
      {isHLSRecordingOn && (
        <Tooltip title="HLS Recording on">
          <Button
            variant="standard"
            outlined
            css={{ color: "$error", ml: "$8", px: "$4" }}
          >
            <RecordIcon />
          </Button>
        </Tooltip>
      )}
      <Button
        variant="standard"
        outlined
        icon
        css={{ mx: "$8" }}
        onClick={() => {
          toggleStreaming();
        }}
      >
        <EndStreamIcon />
        End Stream
      </Button>
    </Flex>
  );
};

export const StreamActions = () => {
  const isConnected = useHMSStore(selectIsConnectedToRoom);
  const isAllowedToPublish = useHMSStore(selectIsAllowedToPublish);
  const permissions = useHMSStore(selectPermissions);
  const isPublishingAnything = Object.values(isAllowedToPublish).some(
    value => !!value
  );
  if (!isConnected || !isPublishingAnything || !permissions.streaming) {
    return null;
  }
  return (
    <Fragment>
      <GoLiveButton />
      <EndStream />
    </Fragment>
  );
};
