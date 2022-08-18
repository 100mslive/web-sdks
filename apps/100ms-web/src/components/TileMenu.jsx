import React from "react";
import {
  HorizontalMenuIcon,
  MicOffIcon,
  VideoOffIcon,
  VideoOnIcon,
  MicOnIcon,
  SpeakerIcon,
  RemoveUserIcon,
  CameraFlipIcon,
} from "@100mslive/react-icons";
import {
  useHMSStore,
  selectPermissions,
  useHMSActions,
  useRemoteAVToggle,
} from "@100mslive/react-sdk";
import { Flex, StyledMenuTile, Slider } from "@100mslive/react-ui";
import { createSnapshotFromVideo } from "../common/utils";

/**
 * Taking peerID as peer won't necesarilly have tracks
 */
const TileMenu = ({
  audioTrackID,
  videoTrackID,
  peerID,
  isScreenshare = false,
  videoRef,
}) => {
  const actions = useHMSActions();
  let { removeOthers } = useHMSStore(selectPermissions);
  removeOthers = removeOthers && !isScreenshare;
  const {
    isAudioEnabled,
    isVideoEnabled,
    setVolume,
    toggleAudio,
    toggleVideo,
    volume,
  } = useRemoteAVToggle(audioTrackID, videoTrackID);
  if (!(removeOthers || toggleAudio || toggleVideo || setVolume)) {
    return null;
  }
  return (
    <StyledMenuTile.Root>
      <StyledMenuTile.Trigger data-testid="participant_menu_btn">
        <HorizontalMenuIcon />
      </StyledMenuTile.Trigger>
      <StyledMenuTile.Content side="top" align="end" sideOffset={8}>
        {toggleVideo ? (
          <StyledMenuTile.ItemButton
            onClick={toggleVideo}
            data-testid={
              isVideoEnabled
                ? "mute_video_participant_btn"
                : "unmute_video_participant_btn"
            }
          >
            {isVideoEnabled ? <VideoOnIcon /> : <VideoOffIcon />}
            <span>{`${isVideoEnabled ? "Mute" : "Request Unmute"}`}</span>
          </StyledMenuTile.ItemButton>
        ) : null}
        {toggleAudio ? (
          <StyledMenuTile.ItemButton
            onClick={toggleAudio}
            data-testid={
              isVideoEnabled
                ? "mute_audio_participant_btn"
                : "unmute_audio_participant_btn"
            }
          >
            {isAudioEnabled ? <MicOnIcon /> : <MicOffIcon />}
            <span>{`${isAudioEnabled ? "Mute" : "Request Unmute"}`}</span>
          </StyledMenuTile.ItemButton>
        ) : null}
        {videoRef ? (
          <StyledMenuTile.ItemButton
            onClick={() => {
              createSnapshotFromVideo(videoRef);
            }}
          >
            <CameraFlipIcon />
            <span>Take Snapshot</span>
          </StyledMenuTile.ItemButton>
        ) : null}
        <StyledMenuTile.ItemButton
          onClick={() => {
            actions.sendDirectMessage(
              JSON.stringify({ capture: Date.now() }),
              peerID,
              "CAPTURE_SNAPSHOT"
            );
          }}
        >
          <CameraFlipIcon />
          <span>Request Snapshot</span>
        </StyledMenuTile.ItemButton>
        {audioTrackID ? (
          <StyledMenuTile.VolumeItem data-testid="participant_volume_slider">
            <Flex align="center" gap={1}>
              <SpeakerIcon /> <span>Volume ({volume})</span>
            </Flex>
            <Slider
              css={{ my: "0.5rem" }}
              step={5}
              value={[volume]}
              onValueChange={e => setVolume(e[0])}
            />
          </StyledMenuTile.VolumeItem>
        ) : null}

        {removeOthers ? (
          <StyledMenuTile.RemoveItem
            onClick={async () => {
              try {
                await actions.removePeer(peerID, "");
              } catch (error) {
                // TODO: Toast here
              }
            }}
            data-testid="remove_participant_btn"
          >
            <RemoveUserIcon />
            <span>Remove Participant</span>
          </StyledMenuTile.RemoveItem>
        ) : null}
      </StyledMenuTile.Content>
    </StyledMenuTile.Root>
  );
};

export default TileMenu;
