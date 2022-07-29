import { Fragment, useState } from "react";
import {
  selectAppData,
  selectIsConnectedToRoom,
  selectPermissions,
  useHMSActions,
  useHMSStore,
  useRecordingStreaming,
} from "@100mslive/react-sdk";
import { EndStreamIcon, RecordIcon } from "@100mslive/react-icons";
import {
  Box,
  Button,
  Flex,
  Loading,
  Popover,
  Text,
  Tooltip,
} from "@100mslive/react-ui";
import GoLiveButton from "../GoLiveButton";
import { AdditionalRoomState, getRecordingText } from "./AdditionalRoomState";
import { getResolution } from "../Streaming/RTMPStreaming";
import { ResolutionInput } from "../MoreSettings/ResolutionInput";
import { useSidepaneToggle } from "../AppData/useSidepane";
import { useSetAppDataByKey } from "../AppData/useUISettings";
import {
  APP_DATA,
  RTMP_RECORD_DEFAULT_RESOLUTION,
  SIDE_PANE_OPTIONS,
} from "../../common/constants";
import { getDefaultMeetingUrl } from "../../common/utils";

export const LiveStatus = () => {
  const { isHLSRunning, isRTMPRunning } = useRecordingStreaming();
  if (!isHLSRunning && !isRTMPRunning) {
    return null;
  }
  return (
    <Flex align="center">
      <Box css={{ w: "$4", h: "$4", r: "$round", bg: "$error", mr: "$2" }} />
      <Text>
        Live
        <Text as="span" css={{ "@md": { display: "none" } }}>
          &nbsp;with {isHLSRunning ? "HLS" : "RTMP"}
        </Text>
      </Text>
    </Flex>
  );
};

export const RecordingStatus = () => {
  const {
    isBrowserRecordingOn,
    isServerRecordingOn,
    isHLSRecordingOn,
    isRecordingOn,
  } = useRecordingStreaming();

  if (!isRecordingOn) {
    return null;
  }
  return (
    <Tooltip
      title={getRecordingText({
        isBrowserRecordingOn,
        isServerRecordingOn,
        isHLSRecordingOn,
      })}
    >
      <Box>
        <Button
          variant="standard"
          outlined
          css={{
            color: "$error",
            px: "$4",
            "@md": { display: "none" },
          }}
        >
          <RecordIcon width={24} height={24} />
        </Button>
        <Box
          css={{
            display: "none",
            "@md": { display: "block", color: "$error" },
          }}
        >
          <RecordIcon width={24} height={24} />
        </Box>
      </Box>
    </Tooltip>
  );
};

const EndStream = () => {
  const { isStreamingOn } = useRecordingStreaming();
  const toggleStreaming = useSidepaneToggle(SIDE_PANE_OPTIONS.STREAMING);
  if (!isStreamingOn) {
    return null;
  }
  return (
    <Button
      variant="standard"
      outlined
      icon
      onClick={() => {
        toggleStreaming();
      }}
    >
      <EndStreamIcon />
      End Stream
    </Button>
  );
};

const StartRecording = () => {
  const permissions = useHMSStore(selectPermissions);
  const recordingUrl = useHMSStore(selectAppData(APP_DATA.recordingUrl));
  const [resolution, setResolution] = useState(RTMP_RECORD_DEFAULT_RESOLUTION);
  const [open, setOpen] = useState(false);
  const [recordingStarted, setRecordingState] = useSetAppDataByKey(
    APP_DATA.recordingStarted
  );
  const hmsActions = useHMSActions();
  if (!permissions?.browserRecording) {
    return null;
  }
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <Button
          variant="standard"
          icon
          disabled={recordingStarted}
          onClick={() => setOpen(true)}
        >
          {recordingStarted ? (
            <Loading size={24} color="currentColor" />
          ) : (
            <RecordIcon />
          )}
          <Text
            as="span"
            css={{ "@md": { display: "none" }, color: "currentColor" }}
          >
            {recordingStarted ? "Starting" : "Start"} Recording
          </Text>
        </Button>
      </Popover.Trigger>
      <Popover.Content align="end">
        <ResolutionInput
          css={{ flexDirection: "column", alignItems: "start" }}
          onResolutionChange={setResolution}
        />
        <Button
          variant="primary"
          icon
          onClick={async () => {
            try {
              setRecordingState(true);
              await hmsActions.startRTMPOrRecording({
                meetingURL: recordingUrl || getDefaultMeetingUrl(),
                resolution: getResolution(resolution),
                record: true,
              });
            } catch (error) {
              setRecordingState(false);
            }
            setOpen(false);
          }}
        >
          <RecordIcon />
          Start Recording
        </Button>
      </Popover.Content>
    </Popover.Root>
  );
};

export const StreamActions = () => {
  const isConnected = useHMSStore(selectIsConnectedToRoom);
  const permissions = useHMSStore(selectPermissions);
  return (
    <Flex align="center" css={{ gap: "$4" }}>
      <AdditionalRoomState />
      <Flex align="center" css={{ gap: "$4", "@md": { display: "none" } }}>
        <LiveStatus />
        <RecordingStatus />
      </Flex>
      {isConnected && <StartRecording />}
      {isConnected && (permissions.hlsStreaming || permissions.rtmpStreaming) && (
        <Fragment>
          <GoLiveButton />
          <EndStream />
        </Fragment>
      )}
    </Flex>
  );
};
