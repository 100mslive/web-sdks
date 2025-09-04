import React from 'react';
import {
  HMSPeerID,
  HMSTrack,
  selectAudioTrackByPeerID,
  selectAudioVolumeByPeerID,
  selectPermissions,
  selectVideoTrackByPeerID,
  useHMSActions,
  useHMSStore,
} from '@100mslive/react-sdk';
import {
  HorizontalMenuIcon,
  MicOffIcon,
  MicOnIcon,
  RemoveUserIcon,
  SpeakerIcon,
  VideoOffIcon,
  VideoOnIcon,
} from '@100mslive/react-icons';
import { Slider } from '../Slider';
import { Flex, StyledMenuTile } from './StyledMenuTile';

export interface TileMenuProps {
  peerId: HMSPeerID;
}

export const TileMenu: React.FC<TileMenuProps> = ({ peerId }) => {
  const actions = useHMSActions();
  const permissions = useHMSStore(selectPermissions);
  // TODO: selectTrackByID vs selectVideoTrackByPeerID
  const videoTrack = useHMSStore(selectVideoTrackByPeerID(peerId));
  const audioTrack = useHMSStore(selectAudioTrackByPeerID(peerId));
  const canMuteVideo = videoTrack?.enabled ? permissions?.mute : permissions?.unmute;
  const canMuteAudio = audioTrack?.enabled ? permissions?.mute : permissions?.unmute;

  const toggleTrackEnabled = async (track?: HMSTrack | null) => {
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
        {canMuteVideo ? (
          <StyledMenuTile.ItemButton onClick={() => toggleTrackEnabled(videoTrack)}>
            {videoTrack?.enabled ? <VideoOnIcon /> : <VideoOffIcon />}
            <span>{`${videoTrack?.enabled ? 'Mute' : 'Unmute'} Video`}</span>
          </StyledMenuTile.ItemButton>
        ) : null}

        {canMuteAudio ? (
          <StyledMenuTile.ItemButton onClick={() => toggleTrackEnabled(audioTrack)}>
            {audioTrack?.enabled ? <MicOnIcon /> : <MicOffIcon />}
            <span>{`${audioTrack?.enabled ? 'Mute' : 'Unmute'} Audio`}</span>
          </StyledMenuTile.ItemButton>
        ) : null}

        {audioTrack ? (
          <StyledMenuTile.VolumeItem>
            <Flex>
              <SpeakerIcon /> <span>Volume ({trackVolume})</span>
            </Flex>
            <Slider
              css={{ my: '0.5rem' }}
              step={5}
              value={[trackVolume || 0]}
              onValueChange={(e: number[]) => actions.setVolume(e[0], audioTrack?.id)}
            />
          </StyledMenuTile.VolumeItem>
        ) : null}

        {permissions?.removeOthers ? (
          <StyledMenuTile.RemoveItem
            onClick={async () => {
              try {
                await actions.removePeer(peerId, '');
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
