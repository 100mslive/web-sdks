import React, { Fragment, Suspense, useCallback, useEffect, useState } from 'react';
import {
  HMSRoomState,
  selectIsLocalVideoEnabled,
  selectLocalPeer,
  selectRoomState,
  selectVideoTrackByID,
  useAVToggle,
  useHMSStore,
  useParticipants,
  usePreviewJoin,
  useRecordingStreaming,
} from '@100mslive/react-sdk';
import { MicOffIcon, SettingsIcon } from '@100mslive/react-icons';
import { sampleLayout } from '../../../../../hms-video-store/src/test/fakeStore/fakeLayoutStore';
import {
  Avatar,
  Box,
  Flex,
  flexCenter,
  Loading,
  styled,
  StyledVideoTile,
  Text,
  useBorderAudioLevel,
  useTheme,
  Video,
} from '../../../';
import { useHMSPrebuiltContext } from '../../AppContext';
import IconButton from '../../IconButton';
import { AudioVideoToggle } from '../AudioVideoToggle';
import Chip from '../Chip';
import TileConnection from '../Connection/TileConnection';
import { Logo } from '../Header/HeaderComponents';
import SettingsModal from '../Settings/SettingsModal';
import PreviewForm from './PreviewForm';
import { useAuthToken, useUISettings } from '../AppData/useUISettings';
import { defaultPreviewPreference, UserPreferencesKeys, useUserPreferences } from '../hooks/useUserPreferences';
import { getParticipantChipContent } from '../../common/utils';
import { UI_SETTINGS } from '../../common/constants';

const VirtualBackground = React.lazy(() => import('../../plugins/VirtualBackground/VirtualBackground'));

const PreviewJoin = ({ onJoin, skipPreview, initialName, asRole }) => {
  const [previewPreference, setPreviewPreference] = useUserPreferences(
    UserPreferencesKeys.PREVIEW,
    defaultPreviewPreference,
  );
  const { isHLSRunning, isRTMPRunning } = useRecordingStreaming();
  const authToken = useAuthToken();
  const [name, setName] = useState(initialName || previewPreference.name);
  const { isLocalAudioEnabled, isLocalVideoEnabled, toggleAudio, toggleVideo } = useAVToggle();
  const roomState = useHMSStore(selectRoomState);
  const [previewError, setPreviewError] = useState(false);
  const { endPoints } = useHMSPrebuiltContext();
  const { peerCount } = useParticipants();
  const { enableJoin, preview, join } = usePreviewJoin({
    name,
    token: authToken,
    initEndpoint: endPoints?.init,
    initialSettings: {
      isAudioMuted: skipPreview || previewPreference.isAudioMuted,
      isVideoMuted: skipPreview || previewPreference.isVideoMuted,
      speakerAutoSelectionBlacklist: ['Yeti Stereo Microphone'],
    },
    captureNetworkQualityInPreview: true,
    handleError: (_, method) => {
      if (method === 'preview') {
        setPreviewError(true);
      }
    },
    asRole,
  });

  const savePreferenceAndJoin = useCallback(() => {
    setPreviewPreference({
      name,
      isAudioMuted: !isLocalAudioEnabled,
      isVideoMuted: !isLocalVideoEnabled,
    });
    join();
    onJoin && onJoin();
  }, [join, isLocalAudioEnabled, isLocalVideoEnabled, name, setPreviewPreference, onJoin]);

  const { preview_header: previewHeader } = sampleLayout.screens.preview.live_streaming.elements;

  useEffect(() => {
    if (authToken) {
      if (skipPreview) {
        savePreferenceAndJoin();
      } else {
        preview();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authToken, skipPreview]);

  return roomState === HMSRoomState.Preview ? (
    <Container css={{ h: '100%', '@md': { justifyContent: 'space-between' } }}>
      {toggleVideo ? null : <Box />}
      <Flex direction="column" justify="center" css={{ w: '100%', maxWidth: '360px' }}>
        <Logo />
        <Text variant="h4" css={{ wordBreak: 'break-word', textAlign: 'center', mt: '$10', '@md': { mt: '$8' } }}>
          {previewHeader.title}
        </Text>
        <Text css={{ c: '$textMedEmp', my: '$4', textAlign: 'center' }} variant="body1">
          {previewHeader.sub_title}
        </Text>
        <Flex justify="center" css={{ my: '$8', gap: '$4' }}>
          {isHLSRunning || isRTMPRunning ? (
            <Chip
              content="LIVE"
              backgroundColor="$error"
              icon={<Box css={{ h: '$sm', w: '$sm', backgroundColor: '$textHighEmp', borderRadius: '$round' }} />}
            />
          ) : null}
          <Chip content={getParticipantChipContent(peerCount)} hideIfNoContent />
        </Flex>
      </Flex>

      {toggleVideo ? (
        <Flex
          align="center"
          justify="center"
          css={{
            '@sm': { width: '100%' },
            flexDirection: 'column',
          }}
        >
          <PreviewTile name={name} error={previewError} />
        </Flex>
      ) : null}

      <Box css={{ w: '100%', maxWidth: '360px' }}>
        <PreviewControls
          enableJoin={enableJoin}
          savePreferenceAndJoin={savePreferenceAndJoin}
          hideSettings={!toggleVideo && !toggleAudio}
        />
        <PreviewForm
          name={name}
          onChange={setName}
          enableJoin={enableJoin}
          onJoin={savePreferenceAndJoin}
          cannotPublishVideo={!toggleVideo}
          cannotPublishAudio={!toggleAudio}
        />
      </Box>
    </Container>
  ) : (
    <Loading size={100} />
  );
};

const Container = styled('div', {
  width: '100%',
  ...flexCenter,
  flexDirection: 'column',
  px: '$10',
});

const PreviewTile = ({ name, error }) => {
  const localPeer = useHMSStore(selectLocalPeer);
  const borderAudioRef = useBorderAudioLevel(localPeer?.audioTrack);
  const { isLocalAudioEnabled, toggleAudio } = useAVToggle();
  const isVideoOn = useHMSStore(selectIsLocalVideoEnabled);
  const mirrorLocalVideo = useUISettings(UI_SETTINGS.mirrorLocalVideo);
  const trackSelector = selectVideoTrackByID(localPeer?.videoTrack);
  const track = useHMSStore(trackSelector);
  const showMuteIcon = !isLocalAudioEnabled || !toggleAudio;

  const {
    aspectRatio: { width, height },
  } = useTheme();
  return (
    <StyledVideoTile.Container
      css={{
        bg: '$surfaceDefault',
        aspectRatio: width / height,
        width: 'unset',
        height: 'min(360px, 60vh)',
        mt: '$12',
        '@sm': {
          height: 'unset',
          width: 'min(360px, 100%)',
          maxWidth: '100%',
        },
      }}
      ref={borderAudioRef}
    >
      {localPeer ? (
        <>
          <TileConnection name={name} peerId={localPeer.id} hideLabel={true} />
          <Video
            mirror={track?.facingMode !== 'environment' && mirrorLocalVideo}
            trackId={localPeer.videoTrack}
            data-testid="preview_tile"
          />
          {!isVideoOn ? (
            <StyledVideoTile.AvatarContainer>
              <Avatar name={name} data-testid="preview_avatar_tile" />
            </StyledVideoTile.AvatarContainer>
          ) : null}
        </>
      ) : !error ? (
        <Loading size={100} />
      ) : null}
      {showMuteIcon ? (
        <StyledVideoTile.AudioIndicator size="medium">
          <MicOffIcon />
        </StyledVideoTile.AudioIndicator>
      ) : null}
    </StyledVideoTile.Container>
  );
};

const PreviewControls = ({ hideSettings }) => {
  return (
    <Flex
      justify="between"
      css={{
        width: '100%',
        mt: '$8',
      }}
    >
      <Flex css={{ gap: '$4' }}>
        <AudioVideoToggle compact />
        <Suspense fallback="">
          <VirtualBackground />
        </Suspense>
      </Flex>
      {!hideSettings ? <PreviewSettings /> : null}
    </Flex>
  );
};

export const PreviewSettings = React.memo(() => {
  const [open, setOpen] = useState(false);
  return (
    <Fragment>
      <IconButton data-testid="preview_setting_btn" onClick={() => setOpen(value => !value)}>
        <SettingsIcon />
      </IconButton>
      {open && <SettingsModal open={open} onOpenChange={setOpen} />}
    </Fragment>
  );
});

export default PreviewJoin;
