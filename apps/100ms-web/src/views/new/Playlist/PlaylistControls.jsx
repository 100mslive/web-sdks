import React from "react";
import {
  HMSPlaylistType,
  selectAudioPlaylist,
  selectVideoPlaylist,
  useHMSActions,
  useHMSStore,
} from "@100mslive/react-sdk";
import {
  PrevIcon,
  NextIcon,
  PlayIcon,
  PauseIcon,
} from "@100mslive/react-icons";
import { Box, Flex, IconButton, Slider, Text } from "@100mslive/react-ui";

const PlaylistProgress = ({ type, duration }) => {
  const selectPlaylist =
    type === HMSPlaylistType.audio ? selectAudioPlaylist : selectVideoPlaylist;
  const progress = useHMSStore(selectPlaylist.progress);
  const hmsActions = useHMSActions();
  const playlistAction =
    type === HMSPlaylistType.audio
      ? hmsActions.audioPlaylist
      : hmsActions.videoPlaylist;

  if (!duration) {
    return null;
  }

  return (
    <Slider
      step={1}
      value={[progress]}
      onValueChange={e => {
        console.log(e[0]);
        playlistAction.seekTo(e[0] * 0.01 * duration);
      }}
    />
  );
};

export const PlaylistControls = ({ type }) => {
  const selector =
    type === HMSPlaylistType.audio ? selectAudioPlaylist : selectVideoPlaylist;
  const active = useHMSStore(selector.selectedItem);
  const selection = useHMSStore(selector.selection);
  if (!active) {
    return null;
  }
  return (
    <Box css={{ p: "$8", borderTop: "1px solid $borderDefault" }}>
      <Flex justify="center">
        <IconButton disabled={!selection.hasPrevious}>
          <PrevIcon />
        </IconButton>
        <IconButton>
          {active.playing ? (
            <PauseIcon width={32} height={32} />
          ) : (
            <PlayIcon width={32} height={32} />
          )}
        </IconButton>
        <IconButton disabled={!selection.hasNext}>
          <NextIcon />
        </IconButton>
      </Flex>
      <PlaylistProgress type={type} duration={active.duration} />
      <Box css={{ mt: "$8" }}>
        <Text variant="md">{active.name}</Text>
        {active.metadata?.description && (
          <Text variant="xs">{active.metadata?.description}</Text>
        )}
      </Box>
    </Box>
  );
};
