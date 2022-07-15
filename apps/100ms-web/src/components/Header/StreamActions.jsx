import { Fragment } from "react";
import {
  selectIsAllowedToPublish,
  selectIsConnectedToRoom,
  selectPermissions,
  useHMSActions,
  useHMSStore,
  useRecordingStreaming,
} from "@100mslive/react-sdk";
import GoLiveButton from "../GoLiveButton";
import { Box, Button, Flex, Text, Tooltip } from "@100mslive/react-ui";
import { EndStreamIcon, RecordIcon } from "@100mslive/react-icons";

const EndStream = () => {
  const { isHLSRecordingOn, isHLSRunning } = useRecordingStreaming();
  const hmsActions = useHMSActions();
  if (!isHLSRunning) {
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
        onClick={async () => {
          await hmsActions.stopHLSStreaming();
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
