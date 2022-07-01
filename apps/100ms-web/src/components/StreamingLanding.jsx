import { Fragment, useCallback, useState } from "react";
import {
  ChevronRightIcon,
  CrossIcon,
  WiredMic,
  ColoredHandIcon,
  GoLiveIcon,
  ChevronLeftIcon,
  RecordIcon,
  InfoIcon,
} from "@100mslive/react-icons";
import {
  Flex,
  Box,
  Text,
  IconButton,
  slideLeftAndFade,
  Button,
  Switch,
} from "@100mslive/react-ui";
import { useSidepaneToggle } from "./AppData/useSidepane";
import { APP_DATA, SIDE_PANE_OPTIONS } from "../common/constants";
import { getDefaultMeetingUrl } from "../common/utils";
import {
  selectAppData,
  useHMSActions,
  useHMSStore,
} from "@100mslive/react-sdk";

export const StreamingLanding = () => {
  const toggleStreaming = useSidepaneToggle(SIDE_PANE_OPTIONS.STREAMING);
  const [showHLS, setShowHLS] = useState(false);

  return (
    <Fragment>
      <Flex css={{ w: "100%", py: "$8" }}>
        <Box
          css={{
            alignSelf: "center",
            p: "$4",
            bg: "$surfaceLight",
            r: "$round",
          }}
        >
          <ColoredHandIcon width={40} height={40} />
        </Box>
        <Box css={{ flex: "1 1 0", mx: "$8" }}>
          <Text variant="sm">Welcome !</Text>
          <Text variant="h6">Let’s get you started</Text>
        </Box>
        <IconButton onClick={toggleStreaming} css={{ alignSelf: "flex-start" }}>
          <CrossIcon />
        </IconButton>
      </Flex>
      <Text variant="tiny" color="$textMedEmp">
        Add Other Speakers
      </Text>
      <Flex
        css={{
          w: "100%",
          p: "$10",
          r: "$1",
          cursor: "pointer",
          bg: "$surfaceLight",
          mb: "$10",
          mt: "$8",
        }}
      >
        <Text css={{ alignSelf: "center", p: "$4" }}>
          <WiredMic width={40} height={40} />
        </Text>
        <Box css={{ flex: "1 1 0", mx: "$8" }}>
          <Text variant="h6" css={{ mb: "$4" }}>
            Invite others to join
          </Text>
          <Text variant="sm">Add more people</Text>
        </Box>
        <Text css={{ alignSelf: "center" }}>
          <ChevronRightIcon />
        </Text>
      </Flex>
      <Text variant="tiny" color="$textMedEmp">
        Start Streaming
      </Text>
      <Flex
        css={{
          w: "100%",
          p: "$10",
          r: "$1",
          cursor: "pointer",
          bg: "$surfaceLight",
          my: "$8",
        }}
        onClick={() => setShowHLS(true)}
      >
        <Text css={{ alignSelf: "center", p: "$4" }}>
          <GoLiveIcon width={40} height={40} />
        </Text>
        <Box css={{ flex: "1 1 0", mx: "$8" }}>
          <Text variant="h6" css={{ mb: "$4" }}>
            Live Stream with HLS
          </Text>
          <Text variant="sm">
            Stream to millions, edit and control what the viewer sees and more!
          </Text>
        </Box>
        <Text css={{ alignSelf: "center" }}>
          <ChevronRightIcon />
        </Text>
      </Flex>
      {showHLS && <HLSStreaming onBack={() => setShowHLS(false)} />}
    </Fragment>
  );
};

const ContentHeader = ({ onBack, title, content }) => {
  return (
    <Flex css={{ w: "100%", py: "$8", px: "$10", cursor: "pointer" }}>
      <Text
        css={{ p: "$2", bg: "$surfaceLight", r: "$round", alignSelf: "center" }}
        onClick={onBack}
      >
        <ChevronLeftIcon width={16} height={16} />
      </Text>
      <Box css={{ flex: "1 1 0", mx: "$8" }}>
        <Text variant="sm">{title}</Text>
        <Text variant="h6">{content}</Text>
      </Box>
      <IconButton onClick={onBack} css={{ alignSelf: "flex-start" }}>
        <CrossIcon width={16} height={16} />
      </IconButton>
    </Flex>
  );
};

const HLSStreaming = ({ onBack }) => {
  const [record, setRecord] = useState(false);
  const recordingUrl = useHMSStore(selectAppData(APP_DATA.recordingUrl));
  const hmsActions = useHMSActions();
  const startHLS = useCallback(async () => {
    await hmsActions.startHLSStreaming({
      variants: [{ meetingURL: recordingUrl || getDefaultMeetingUrl() }],
      recording: record
        ? { hlsVod: true, singleFilePerLayer: true }
        : undefined,
    });
  }, [recordingUrl, hmsActions, record]);
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
      <Flex
        align="center"
        css={{ bg: "$surfaceLight", m: "$8", p: "$8", r: "$0" }}
      >
        <Text>
          <RecordIcon />
        </Text>
        <Text variant="sm" css={{ flex: "1 1 0", mx: "$8" }}>
          Record the stream
        </Text>
        <Switch checked={record} onCheckedChange={setRecord} />
      </Flex>
      <Box css={{ p: "$4 $8" }}>
        <Button css={{ w: "100%", r: "$0" }} onClick={startHLS}>
          <GoLiveIcon />
          <Text css={{ mx: "$2" }}>Go Live</Text>
        </Button>
      </Box>
      <Flex align="center" css={{ p: "$4 $8" }}>
        <Text>
          <InfoIcon width={16} height={16} />
        </Text>
        <Text variant="tiny" color="$textMedEmp" css={{ mx: "$8" }}>
          You cannot start recording once the stream starts, you will have to
          stop the stream to enable recording.
        </Text>
      </Flex>
    </Box>
  );
};
