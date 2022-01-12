import * as Popover from '@radix-ui/react-popover';
import React from 'react';
import {
  HorizontalMenuIcon,
  MicOffIcon,
  VideoOffIcon,
  VideoOnIcon,
  MicOnIcon,
  SpeakerIcon,
  RemoveUserIcon,
} from '@100mslive/react-icons';
import {
  useHMSStore,
  selectVideoTrackByPeerID,
  HMSPeerID,
  selectPermissions,
  selectAudioTrackByPeerID,
  useHMSActions,
  HMSTrack,
  selectAudioVolumeByPeerID,
} from '@100mslive/react-sdk';
import { Slider } from '../Slider';
import {
  StyledRoot,
  StyledTrigger,
  StyledContent,
  StyledItemButton,
  StyledVolumeItem,
  Flex,
  RemoveMenuItem,
} from './StyledMenuTile';

interface Props {
  id: HMSPeerID;
}

export const TileMenu: React.FC<Props> = ({ id }) => {
  const actions = useHMSActions();
  const permissions = useHMSStore(selectPermissions);
  // TODO: selectTrackByID vs selectVideoTrackByPeerID
  const videoTrack = useHMSStore(selectVideoTrackByPeerID(id));
  const audioTrack = useHMSStore(selectAudioTrackByPeerID(id));
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
  const trackVolume = useHMSStore(selectAudioVolumeByPeerID(id));
  return (
    <StyledRoot className="tile-menu">
      <Popover.Root>
        <StyledTrigger>
          <HorizontalMenuIcon />
        </StyledTrigger>
        <StyledContent align="start" sideOffset={10}>
          {canMuteVideo ? (
            <StyledItemButton onClick={() => toggleTrackEnabled(videoTrack)}>
              {videoTrack?.enabled ? <VideoOnIcon /> : <VideoOffIcon />}
              <span>{`${videoTrack?.enabled ? 'Mute' : 'Unmute'} Video`}</span>
            </StyledItemButton>
          ) : null}

          {canMuteAudio ? (
            <StyledItemButton onClick={() => toggleTrackEnabled(audioTrack)}>
              {audioTrack?.enabled ? <MicOnIcon /> : <MicOffIcon />}
              <span>{`${audioTrack?.enabled ? 'Mute' : 'Unmute'} Audio`}</span>
            </StyledItemButton>
          ) : null}

          <StyledVolumeItem>
            <Flex>
              <SpeakerIcon /> <span>Volume ({trackVolume})</span>
            </Flex>
            <Slider
              css={{ my: '0.5rem' }}
              step={5}
              value={[trackVolume || 0]}
              onValueChange={e => actions.setVolume(e[0], audioTrack?.id)}
            />
          </StyledVolumeItem>

          {permissions?.removeOthers ? (
            <RemoveMenuItem
              onClick={async () => {
                try {
                  await actions.removePeer(id, '');
                } catch (error) {
                  // TODO: Toast here
                }
              }}
            >
              <RemoveUserIcon />
              <span>Remove Participant</span>
            </RemoveMenuItem>
          ) : null}
        </StyledContent>
      </Popover.Root>
    </StyledRoot>
  );
};
