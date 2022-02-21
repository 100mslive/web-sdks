import React, { Fragment, useContext } from "react";
import {
  Flex,
  Dropdown,
  IconButton,
  Text,
  textEllipsis,
  Box,
  Tooltip,
  styled,
} from "@100mslive/react-ui";
import {
  ChevronDownIcon,
  RecordIcon,
  SpeakerIcon,
  GlobeIcon,
  MusicIcon,
} from "@100mslive/react-icons";
import {
  useHMSStore,
  selectDominantSpeaker,
  selectLocalPeer,
  useRecordingStreaming,
} from "@100mslive/react-sdk";
import { ParticipantList } from "./ParticipantList";
import PIPComponent from "../PIP/PIPComponent";
import { usePlaylistMusic } from "../hooks/usePlaylistMusic";
import { getRecordingText, getStreamingText } from "../../common/utils";
import { AppContext } from "../../store/AppContext";
import { DEFAULT_HLS_VIEWER_ROLE } from "../../common/constants";

const SpeakerTag = () => {
  const dominantSpeaker = useHMSStore(selectDominantSpeaker);
  return dominantSpeaker && dominantSpeaker.name ? (
    <Flex
      align="center"
      justify="center"
      css={{ flex: "1 1 0", color: "$textPrimary", "@md": { display: "none" } }}
    >
      <SpeakerIcon width={24} height={24} />
      <Text
        variant="md"
        css={{ ...textEllipsis(200), ml: "$2" }}
        title={dominantSpeaker.name}
      >
        {dominantSpeaker.name}
      </Text>
    </Flex>
  ) : (
    <></>
  );
};

const PlaylistAndStreaming = () => {
  const playlist = usePlaylistMusic();
  const {
    isServerRecordingOn,
    isBrowserRecordingOn,
    isHLSRecordingOn,
    isStreamingOn,
    isHLSRunning,
    isRecordingOn,
  } = useRecordingStreaming();
  if (!playlist && !isRecordingOn && !isStreamingOn) {
    return null;
  }

  return (
    <Fragment>
      {playlist && (
        <Tooltip title="Playlist Music">
          <Flex align="center" css={{ color: "$textPrimary", mx: "$2" }}>
            <MusicIcon width={24} height={24} />
          </Flex>
        </Tooltip>
      )}
      <Flex
        align="center"
        css={{
          color: "$error",
        }}
      >
        {isRecordingOn && (
          <Tooltip
            title={getRecordingText({
              isBrowserRecordingOn,
              isServerRecordingOn,
              isHLSRecordingOn,
            })}
          >
            <Box>
              <RecordIcon
                width={24}
                height={24}
                style={{ marginRight: "0.25rem" }}
              />
            </Box>
          </Tooltip>
        )}
        {isStreamingOn && (
          <Tooltip title={getStreamingText({ isStreamingOn, isHLSRunning })}>
            <Box>
              <GlobeIcon width={24} height={24} />
            </Box>
          </Tooltip>
        )}
      </Flex>
      <Dropdown>
        <Dropdown.Trigger asChild>
          <IconButton
            css={{
              mr: "$2",
              alignSelf: "center",
            }}
          >
            <ChevronDownIcon />
          </IconButton>
        </Dropdown.Trigger>
        <Dropdown.Content sideOffset={5} align="end" css={{ w: "$60" }}>
          {isRecordingOn && (
            <Dropdown.Item css={{ color: "$error" }}>
              <RecordIcon width={24} height={24} />
              <Text
                variant="sm"
                css={{ ml: "$2", flex: "1 1 0", ...textEllipsis("80%") }}
              >
                Recording (
                {getRecordingText(
                  {
                    isBrowserRecordingOn,
                    isServerRecordingOn,
                    isHLSRecordingOn,
                  },
                  "|"
                )}
                )
              </Text>
            </Dropdown.Item>
          )}
          {isStreamingOn && (
            <Dropdown.Item css={{ color: "$error" }}>
              <GlobeIcon width={24} height={24} />
              <Text variant="sm" css={{ ml: "$2" }}>
                Streaming ({isHLSRunning ? "HLS" : "RTMP"})
              </Text>
            </Dropdown.Item>
          )}
          {(isRecordingOn || isStreamingOn) && playlist && (
            <Dropdown.ItemSeparator />
          )}
          {playlist && (
            <Dropdown.Item css={{ color: "$textPrimary" }}>
              <MusicIcon width={24} height={24} />
              <Text variant="sm" css={{ ml: "$2", flex: "1 1 0" }}>
                Playlist is playing
              </Text>
              {playlist.peer.isLocal ? (
                <Text
                  variant="sm"
                  css={{ color: "$error", cursor: "pointer", ml: "$2" }}
                  onClick={e => {
                    e.preventDefault();
                    playlist.selection.playing
                      ? playlist.pause()
                      : playlist.play(playlist.selection.id);
                  }}
                >
                  {playlist.selection.playing ? "Pause" : "Play"}
                </Text>
              ) : (
                <Text
                  variant="sm"
                  css={{ color: "$error", ml: "$2", cursor: "pointer" }}
                  onClick={e => {
                    e.preventDefault();
                    playlist.setVolume(
                      !playlist.track.volume ? 100 : 0,
                      playlist.track.id
                    );
                  }}
                >
                  {playlist.track.volume === 0 ? "Unmute" : "Mute"}
                </Text>
              )}
            </Dropdown.Item>
          )}
        </Dropdown.Content>
      </Dropdown>
    </Fragment>
  );
};

const LogoImg = styled("img", {
  maxHeight: "$14",
  "@md": {
    maxHeight: "$12",
  },
});

const Logo = () => {
  const { logo } = useContext(AppContext);
  return <LogoImg src={logo} alt="Brand Logo" />;
};

export const Header = ({ isPreview }) => {
  const localPeer = useHMSStore(selectLocalPeer);
  const showPip = localPeer?.roleName !== DEFAULT_HLS_VIEWER_ROLE && !isPreview;
  return (
    <Flex
      justify="between"
      align="center"
      css={{ position: "relative", height: "100%" }}
    >
      <Flex align="center" css={{ position: "absolute", left: "$4" }}>
        <Logo />
      </Flex>
      <SpeakerTag />
      <Flex align="center" css={{ position: "absolute", right: "$4" }}>
        {showPip && <PIPComponent />}
        <Flex align="center" css={{ mx: "$2" }}>
          <PlaylistAndStreaming />
        </Flex>
        <Box css={{ mx: "$2" }}>
          <ParticipantList />
        </Box>
      </Flex>
    </Flex>
  );
};
