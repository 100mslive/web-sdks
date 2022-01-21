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
  useHMSActions,
  useHMSStore,
  selectDominantSpeaker,
} from "@100mslive/react-sdk";
import { AppContext } from "../store/AppContext";
import PIPComponent from "./PIP/PIPComponent";
import { metadataProps as participantInListProps } from "../common/utils";
import { usePlaylistMusic } from "./hooks/usePlaylistMusic";

const SpeakerTag = () => {
  const dominantSpeaker = useHMSStore(selectDominantSpeaker) || {
    name: "sbfdshbfhdshfbdsfdsfbdsfsd",
  };
  return dominantSpeaker && dominantSpeaker.name ? (
    <Flex align="center" css={{ ml: "auto", mr: "auto" }}>
      <IconButton css={{ height: "max-content" }}>
        <SpeakerIcon width={24} height={24} />
      </IconButton>
      <Text
        variant="body"
        css={{ ...truncate(200) }}
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
  const hmsActions = useHMSActions();
  const playlist = usePlaylistMusic();

  if (!playlist) {
    return null;
  }
  const { peer, selection, track } = playlist;

  return (
    <Flex align="center">
      <IconButton css={{ height: "max-content" }}>
        <SpeakerIcon width={24} height={24} />
      </IconButton>
      <Text variant="body" css={{ mx: "$1" }}>
        Playlist is playing
      </Text>
      {peer.isLocal ? (
        <Text
          variant="body"
          onClick={async () => {
            if (selection.playing) {
              hmsActions.audioPlaylist.pause();
            } else {
              await hmsActions.audioPlaylist.play(selection.id);
            }
          }}
          css={{ color: "$redMain", cursor: "pointer" }}
        >
          {selection.playing ? "Pause" : "Play"}
        </Text>
      ) : (
        <Text
          variant="body"
          onClick={() => {
            hmsActions.setVolume(!track.volume ? 100 : 0, track.id);
          }}
          css={{ color: "$redMain", cursor: "pointer" }}
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
    <Flex align="center" css={{ mx: "$2" }}>
      {isRecordingOn && (
        <Flex align="center" title={getRecordingText()}>
          <IconButton
            css={{ height: "max-content", "& path": { fill: "$redMain" } }}
          >
            <RecordIcon width={24} height={24} />
          </IconButton>
          <Text variant="body" css={{ mx: "$1" }}>
            Recording
          </Text>
        </Flex>
      )}
      {isStreamingOn && (
        <Flex align="center" css={{ mx: "$2" }} title={getStreamingText()}>
          <IconButton
            css={{ height: "max-content", "& path": { fill: "$redMain" } }}
          >
            <GlobeIcon width={24} height={24} />
          </IconButton>
          <Text variant="body" css={{ mx: "$1" }}>
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
    <Flex>
      <LogoButton />
      <PlaylistMusic />
      <StreamingRecording />
      <SpeakerTag />
      <Dropdown>
        <DropdownTrigger asChild>
          <IconButton
            css={{
              ml: "auto",
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
      <Box>
        <ParticipantList
          key={1}
          participantInListProps={participantInListProps}
        />
      </Box>
    </Flex>
  );
};
