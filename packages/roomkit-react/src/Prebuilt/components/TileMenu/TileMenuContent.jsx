import React from 'react';
import {
  selectPeerNameByID,
  selectPermissions,
  useCustomEvent,
  useHMSActions,
  useHMSStore,
  useRemoteAVToggle,
} from '@100mslive/react-sdk';
import {
  MicOffIcon,
  MicOnIcon,
  RemoveUserIcon,
  ShareScreenIcon,
  SpeakerIcon,
  VideoOffIcon,
  VideoOnIcon,
} from '@100mslive/react-icons';
import { Box, Flex } from '../../../Layout';
import { Slider } from '../../../Slider';
import { StyledMenuTile } from '../../../TileMenu';
import { REMOTE_STOP_SCREENSHARE_TYPE } from '../../common/constants';

export const TileMenuContent = props => {
  const actions = useHMSActions();
  const { removeOthers } = useHMSStore(selectPermissions);
  const {
    pinActions: PinActions,
    spotlightActions: SpotlightActions,
    simulcastLayers: SimulcastLayers,
    videoTrackID,
    audioTrackID,
    isLocal,
    isScreenshare,
    showSpotlight,
    showPinAction,
    peerID,
    spacingCSS,
    closeSheetOnClick = () => {},
  } = props;

  const { isAudioEnabled, isVideoEnabled, setVolume, toggleAudio, toggleVideo, volume } = useRemoteAVToggle(
    audioTrackID,
    videoTrackID,
  );

  const { sendEvent } = useCustomEvent({
    type: REMOTE_STOP_SCREENSHARE_TYPE,
  });

  return isLocal ? (
    showPinAction && (
      <>
        <PinActions audioTrackID={audioTrackID} videoTrackID={videoTrackID} />
        {showSpotlight && <SpotlightActions audioTrackID={audioTrackID} videoTrackID={videoTrackID} />}
      </>
    )
  ) : (
    <>
      {toggleVideo ? (
        <StyledMenuTile.ItemButton
          css={spacingCSS}
          onClick={() => {
            toggleVideo();
            closeSheetOnClick();
          }}
          data-testid={isVideoEnabled ? 'mute_video_participant_btn' : 'unmute_video_participant_btn'}
        >
          {isVideoEnabled ? <VideoOnIcon /> : <VideoOffIcon />}
          <span>{isVideoEnabled ? 'Mute' : 'Request Unmute'}</span>
        </StyledMenuTile.ItemButton>
      ) : null}
      {toggleAudio ? (
        <StyledMenuTile.ItemButton
          css={spacingCSS}
          onClick={() => {
            toggleAudio();
            closeSheetOnClick();
          }}
          data-testid={isVideoEnabled ? 'mute_audio_participant_btn' : 'unmute_audio_participant_btn'}
        >
          {isAudioEnabled ? <MicOnIcon /> : <MicOffIcon />}
          <span>{isAudioEnabled ? 'Mute' : 'Request Unmute'}</span>
        </StyledMenuTile.ItemButton>
      ) : null}
      {audioTrackID ? (
        <StyledMenuTile.VolumeItem data-testid="participant_volume_slider" css={{ ...spacingCSS, mb: '$0' }}>
          <Flex align="center" gap={1}>
            <SpeakerIcon />
            <Box as="span" css={{ ml: '$4' }}>
              Volume ({volume})
            </Box>
          </Flex>
          <Slider css={{ my: '0.5rem' }} step={5} value={[volume]} onValueChange={e => setVolume(e[0])} />
        </StyledMenuTile.VolumeItem>
      ) : null}
      {showPinAction && (
        <>
          <PinActions audioTrackID={audioTrackID} videoTrackID={videoTrackID} />
          {showSpotlight && <SpotlightActions audioTrackID={audioTrackID} videoTrackID={videoTrackID} />}
        </>
      )}
      <SimulcastLayers trackId={videoTrackID} />
      {removeOthers ? (
        <StyledMenuTile.RemoveItem
          css={{ ...spacingCSS, borderTop: 'none' }}
          onClick={async () => {
            try {
              await actions.removePeer(peerID, '');
            } catch (error) {
              // TODO: Toast here
            }
            closeSheetOnClick();
          }}
          data-testid="remove_participant_btn"
        >
          <RemoveUserIcon />
          <span>Remove Participant</span>
        </StyledMenuTile.RemoveItem>
      ) : null}

      {removeOthers && isScreenshare ? (
        <StyledMenuTile.RemoveItem
          onClick={() => {
            sendEvent({});
            closeSheetOnClick();
          }}
          css={spacingCSS}
        >
          <ShareScreenIcon />
          <span>Stop Screenshare</span>
        </StyledMenuTile.RemoveItem>
      ) : null}
    </>
  );
};
