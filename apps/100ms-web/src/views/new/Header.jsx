import React, { useContext } from "react";
import {
  Flex,
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  IconButton,
  DropdownItemSeparator,
  Text,
  truncate,
  Box,
} from "@100mslive/react-ui";
import { ParticipantList, LogoButton } from "@100mslive/hms-video-react";
import {
  ChevronDownIcon,
  RecordIcon,
  SpeakerIcon,
  GlobeIcon,
} from "@100mslive/react-icons";
import {
  selectHLSState,
  selectLocalPeer,
  selectRecordingState,
  selectRTMPState,
  useHMSStore,
  selectDominantSpeaker,
} from "@100mslive/react-sdk";
import { AppContext } from "../../store/AppContext";
import PIPComponent from "../PIP/PIPComponent";
import { metadataProps as participantInListProps } from "../../common/utils";
import { usePlaylistMusic } from "../hooks/usePlaylistMusic";

const SpeakerTag = () => {
  const dominantSpeaker = useHMSStore(selectDominantSpeaker);
  return dominantSpeaker && dominantSpeaker.name ? (
    <Flex
      align="center"
      justify="center"
      css={{ flex: "1 1 0", color: "$textPrimary" }}
    >
      <SpeakerIcon width={24} height={24} />
      <Text
        variant="md"
        css={{ ...truncate(200), ml: "$2" }}
        title={dominantSpeaker.name}
      >
        {dominantSpeaker.name}
      </Text>
    </Flex>
  ) : (
    <></>
  );
};

const PlaylistMusic = () => {
  const playlist = usePlaylistMusic();

  if (!playlist) {
    return null;
  }
  const { peer, selection, track, play, pause, setVolume } = playlist;

  return (
    <Flex align="center" css={{ color: "$textPrimary", ml: "$4" }}>
      <SpeakerIcon width={24} height={24} />
      <Text variant="md" css={{ mx: "$2" }}>
        Playlist is playing
      </Text>
      {peer.isLocal ? (
        <Text
          variant="md"
          onClick={async () => {
            if (selection.playing) {
              pause();
            } else {
              await play(selection.id);
            }
          }}
          css={{ color: "$error", cursor: "pointer" }}
        >
          {selection.playing ? "Pause" : "Play"}
        </Text>
      ) : (
        <Text
          variant="md"
          onClick={() => {
            setVolume(!track.volume ? 100 : 0, track.id);
          }}
          css={{ color: "$error", cursor: "pointer" }}
        >
          {track.volume === 0 ? "Unmute" : "Mute"}
        </Text>
      )}
    </Flex>
  );
};

const StreamingRecording = () => {
  const recording = useHMSStore(selectRecordingState);
  const rtmp = useHMSStore(selectRTMPState);
  const hls = useHMSStore(selectHLSState);

  if (
    [
      recording.browser.running,
      recording.server.running,
      hls.running,
      rtmp.running,
    ].every(value => !value)
  ) {
    return null;
  }

  const isRecordingOn = recording.browser.running || recording.server.running;
  const isStreamingOn = hls.running || rtmp.running;
  const getRecordingText = () => {
    if (!isRecordingOn) {
      return "";
    }
    let title = "";
    if (recording.browser.running) {
      title += "Browser Recording: on";
    }
    if (recording.server.running) {
      if (title) {
        title += "\n";
      }
      title += "Server Recording: on";
    }
    return title;
  };

  const getStreamingText = () => {
    if (isStreamingOn) {
      return hls.running ? "HLS" : "RTMP";
    }
  };

  return (
    <Flex align="center" css={{ mx: "$4" }}>
      {isRecordingOn && (
        <Flex
          align="center"
          css={{ color: "$error" }}
          title={getRecordingText()}
        >
          <RecordIcon width={24} height={24} />
          <Text variant="body" css={{ mx: "$2" }}>
            Recording
          </Text>
        </Flex>
      )}
      {isStreamingOn && (
        <Flex
          align="center"
          css={{ mx: "$2", color: "$error" }}
          title={getStreamingText()}
        >
          <GlobeIcon width={24} height={24} />
          <Text variant="body" css={{ mx: "$2" }}>
            Streaming
          </Text>
        </Flex>
      )}
    </Flex>
  );
};

export const Header = () => {
  const { HLS_VIEWER_ROLE } = useContext(AppContext);
  const localPeer = useHMSStore(selectLocalPeer);
  return (
    <Flex
      justify="between"
      align="center"
      css={{ position: "relative", height: "100%" }}
    >
      <Flex align="center" css={{ position: "absolute", left: "$4" }}>
        <LogoButton />
        <PlaylistMusic />
        <StreamingRecording />
      </Flex>
      <SpeakerTag />
      <Flex align="center" css={{ position: "absolute", right: "$4" }}>
        <Dropdown>
          <DropdownTrigger asChild>
            <IconButton
              css={{
                mr: "$2",
                height: "max-content",
                alignSelf: "center",
                display: "none",
                "@md": { display: "block" },
              }}
            >
              <ChevronDownIcon />
            </IconButton>
          </DropdownTrigger>
          <DropdownContent sideOffset={5} align="end">
            <DropdownItem>Hello</DropdownItem>
            <DropdownItem>Test</DropdownItem>
            <DropdownItemSeparator />
            <DropdownItem>Test1</DropdownItem>
          </DropdownContent>
        </Dropdown>
        {localPeer.roleName !== HLS_VIEWER_ROLE && <PIPComponent key={0} />}
        <Box css={{ mx: "$2" }}>
          <ParticipantList
            key={1}
            participantInListProps={participantInListProps}
          />
        </Box>
      </Flex>
    </Flex>
  );
};
