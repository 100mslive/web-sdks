import {
  EndStreamIcon,
  GoLiveIcon,
  InfoIcon,
  RecordIcon,
} from "@100mslive/react-icons";
import {
  selectAppData,
  selectPermissions,
  useHMSActions,
  useHMSStore,
  useRecordingStreaming,
} from "@100mslive/react-sdk";
import {
  Box,
  Button,
  Flex,
  slideLeftAndFade,
  Switch,
  Text,
} from "@100mslive/react-ui";
import { Fragment, useCallback, useState } from "react";
import { APP_DATA, SIDE_PANE_OPTIONS } from "../../common/constants";
import { getDefaultMeetingUrl } from "../../common/utils";
import { useSidepaneToggle } from "../AppData/useSidepane";
import { ContentHeader } from "./Common";

export const HLSStreaming = ({ onBack }) => {
  const { isHLSRunning } = useRecordingStreaming();
  return (
    <Box
      css={{
        size: "100%",
        zIndex: 2,
        position: "absolute",
        top: 0,
        left: 0,
        bg: "$surfaceDefault",
        transform: "translateX(10%)",
        animation: `${slideLeftAndFade("10%")} 100ms ease-out forwards`,
      }}
    >
      <ContentHeader title="Start Streaming" content="HLS" onBack={onBack} />
      <Box css={{ p: "$10" }}>
        <Text>
          <GoLiveIcon width={40} height={40} />
        </Text>
        <Text css={{ fontWeight: "$semiBold", mt: "$8", mb: "$4" }}>
          HLS Streaming
        </Text>
        <Text variant="sm" color="$textMedEmp">
          Stream directly from the browser using any device with multiple hosts
          and real-time messaging, all within this platform.
        </Text>
      </Box>
      {isHLSRunning ? <EndHLS /> : <StartHLS />}
    </Box>
  );
};

const StartHLS = () => {
  const [record, setRecord] = useState(false);
  const recordingUrl = useHMSStore(selectAppData(APP_DATA.recordingUrl));
  const hmsActions = useHMSActions();
  const toggleStreaming = useSidepaneToggle(SIDE_PANE_OPTIONS.STREAMING);
  const permissions = useHMSStore(selectPermissions);
  const startHLS = useCallback(async () => {
    await hmsActions.startHLSStreaming({
      variants: [{ meetingURL: recordingUrl || getDefaultMeetingUrl() }],
      recording: record
        ? { hlsVod: true, singleFilePerLayer: true }
        : undefined,
    });
    toggleStreaming();
  }, [recordingUrl, hmsActions, record, toggleStreaming]);

  return (
    <Fragment>
      {permissions.recording && (
        <Flex
          align="center"
          css={{ bg: "$surfaceLight", m: "$8 $10", p: "$8", r: "$0" }}
        >
          <Text css={{ color: "$error" }}>
            <RecordIcon />
          </Text>
          <Text variant="sm" css={{ flex: "1 1 0", mx: "$8" }}>
            Record the stream
          </Text>
          <Switch checked={record} onCheckedChange={setRecord} />
        </Flex>
      )}
      <Box css={{ p: "$4 $10" }}>
        <Button css={{ w: "100%", r: "$0" }} icon onClick={startHLS}>
          <GoLiveIcon />
          Go Live
        </Button>
      </Box>
      <Flex align="center" css={{ p: "$4 $10" }}>
        <Text>
          <InfoIcon width={16} height={16} />
        </Text>
        <Text variant="tiny" color="$textMedEmp" css={{ mx: "$8" }}>
          You cannot start recording once the stream starts, you will have to
          stop the stream to enable recording.
        </Text>
      </Flex>
    </Fragment>
  );
};

const EndHLS = () => {
  const hmsActions = useHMSActions();
  return (
    <Box css={{ p: "$4 $10" }}>
      <Button
        variant="danger"
        css={{ w: "100%", r: "$0", my: "$8" }}
        icon
        onClick={async () => {
          await hmsActions.stopHLSStreaming();
        }}
      >
        <EndStreamIcon />
        End Stream
      </Button>
    </Box>
  );
};
