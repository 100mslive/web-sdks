import React from "react";
import {
  HorizontalMenuIcon,
  MicOffIcon,
  VideoOffIcon,
  VideoOnIcon,
  MicOnIcon,
  SpeakerIcon,
  RemoveUserIcon,
} from "@100mslive/react-icons";
import {
  useHMSStore,
  selectVideoTrackByPeerID,
  selectPermissions,
  selectAudioTrackByPeerID,
  useHMSActions,
  selectAudioVolumeByPeerID,
} from "@100mslive/react-sdk";
import { Flex, StyledMenuTile, Slider } from "@100mslive/react-ui";

const HmsTileMenu = ({ peerId }) => {
  const actions = useHMSActions();
  const permissions = useHMSStore(selectPermissions);
  // TODO: selectTrackByID vs selectVideoTrackByPeerID
  const videoTrack = useHMSStore(selectVideoTrackByPeerID(peerId));
  const audioTrack = useHMSStore(selectAudioTrackByPeerID(peerId));
  const canToggleVideo = videoTrack?.enabled
    ? permissions?.mute
    : permissions?.unmute;
  const canToggleAudio = audioTrack?.enabled
    ? permissions?.mute
    : permissions?.unmute;
  const toggleTrackEnabled = async track => {
    if (track) {
      try {
        await actions.setRemoteTrackEnabled(track.id, !track.enabled);
      } catch (error) {
        // TODO: add toast here
      }
    }
  };
  const trackVolume = useHMSStore(selectAudioVolumeByPeerID(peerId));
  return (
    <StyledMenuTile.Root>
      <StyledMenuTile.Trigger>
        <HorizontalMenuIcon />
      </StyledMenuTile.Trigger>
      <StyledMenuTile.Content side="left" align="start" sideOffset={10}>
        {canToggleVideo ? (
          <StyledMenuTile.ItemButton
            onClick={() => toggleTrackEnabled(videoTrack)}
          >
            {videoTrack?.enabled ? <VideoOnIcon /> : <VideoOffIcon />}
            <span>{`${videoTrack?.enabled ? "Mute" : "Unmute"} Video`}</span>
          </StyledMenuTile.ItemButton>
        ) : null}
        {canToggleAudio ? (
          <StyledMenuTile.ItemButton
            onClick={() => toggleTrackEnabled(audioTrack)}
          >
            {audioTrack?.enabled ? <MicOnIcon /> : <MicOffIcon />}
            <span>{`${audioTrack?.enabled ? "Mute" : "Unmute"} Audio`}</span>
          </StyledMenuTile.ItemButton>
        ) : null}

        {audioTrack ? (
          <StyledMenuTile.VolumeItem>
            <Flex align="center" gap={1}>
              <SpeakerIcon /> <span>Volume ({trackVolume})</span>
            </Flex>
            <Slider
              css={{ my: "0.5rem" }}
              step={5}
              value={[trackVolume || 0]}
              onValueChange={e => actions.setVolume(e[0], audioTrack?.id)}
            />
          </StyledMenuTile.VolumeItem>
        ) : null}

        {permissions?.removeOthers ? (
          <StyledMenuTile.RemoveItem
            onClick={async () => {
              try {
                await actions.removePeer(peerId, "");
              } catch (error) {
                // TODO: Toast here
              }
            }}
          >
            <RemoveUserIcon />
            <span>Remove Participant</span>
          </StyledMenuTile.RemoveItem>
        ) : null}
      </StyledMenuTile.Content>
    </StyledMenuTile.Root>
  );
};

export default HmsTileMenu;
