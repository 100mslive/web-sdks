import React, { useState } from "react";
import { AudioPlayerIcon, CrossIcon } from "@100mslive/react-icons";
import { Dropdown, IconButton, Text, Flex } from "@100mslive/react-ui";
import {
  HMSPlaylistType,
  selectAudioPlaylist,
  useHMSActions,
  useHMSStore,
} from "@100mslive/react-sdk";
import { PlaylistItem } from "./PlaylistItem";
import { PlaylistControls } from "./PlaylistControls";

export const AudioPlaylist = () => {
  const playlist = useHMSStore(selectAudioPlaylist.list);
  const active = useHMSStore(selectAudioPlaylist.selectedItem);
  const hmsActions = useHMSActions();
  const [open, setOpen] = useState(false);

  if (playlist.length === 0) {
    return null;
  }

  return (
    <Dropdown.Root open={open} onOpenChange={setOpen}>
      <Dropdown.Trigger asChild>
        <IconButton active={!active}>
          <AudioPlayerIcon />
        </IconButton>
      </Dropdown.Trigger>
      <Dropdown.Content
        sideOffset={5}
        align="center"
        css={{ maxHeight: "unset", width: "$60", p: "$0" }}
      >
        <Flex
          align="center"
          css={{
            p: "$4 $8",
            borderBottom: "1px solid $borderDefault",
          }}
        >
          <Text variant="md" css={{ flex: "1 1 0" }}>
            Audio Player
          </Text>
          <IconButton
            css={{ mr: "-$4" }}
            onClick={() => {
              if (active) {
                hmsActions.audioPlaylist.stop();
              }
              setOpen(false);
            }}
          >
            <CrossIcon width={24} height={24} />
          </IconButton>
        </Flex>
        {playlist.map(playlistItem => {
          return (
            <PlaylistItem
              key={playlistItem.id}
              {...playlistItem}
              onClick={e => {
                e.preventDefault();
                hmsActions.audioPlaylist.play(playlistItem.id);
              }}
            />
          );
        })}
        <PlaylistControls type={HMSPlaylistType.audio} />
      </Dropdown.Content>
    </Dropdown.Root>
  );
};
