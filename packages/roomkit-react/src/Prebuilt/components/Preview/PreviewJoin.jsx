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
import {
  Avatar,
  Box,
  Flex,
  flexCenter,
  styled,
  StyledVideoTile,
  Text,
  useBorderAudioLevel,
  useTheme,
  Video,
} from '../../../';
import { useHMSPrebuiltContext } from '../../AppContext';
import IconButton from '../../IconButton';
import { useRoomLayout } from '../../provider/roomLayoutProvider';
import { AudioVideoToggle } from '../AudioVideoToggle';
import Chip from '../Chip';
import TileConnection from '../Connection/TileConnection';
import FullPageProgress from '../FullPageProgress';
import { Logo } from '../Header/HeaderComponents';
import SettingsModal from '../Settings/SettingsModal';
import PreviewForm from './PreviewForm';
import { useAuthToken, useUISettings } from '../AppData/useUISettings';
import { defaultPreviewPreference, UserPreferencesKeys, useUserPreferences } from '../hooks/useUserPreferences';
import { UI_SETTINGS } from '../../common/constants';

const VirtualBackground = React.lazy(() => import('../../plugins/VirtualBackground/VirtualBackground'));

const getParticipantChipContent = (peerCount = 0) => {
  if (peerCount === 0) {
    return 'You are the first to join';
  }
  const formatter = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 2 });
  const formattedNum = formatter.format(peerCount);
  return `${formattedNum} other${parseInt(formattedNum) === 1 ? '' : 's'} in the session`;
};

const PreviewJoin = ({ onJoin, skipPreview, initialName, asRole }) => {
  const [previewPreference, setPreviewPreference] = useUserPreferences(
    UserPreferencesKeys.PREVIEW,
    defaultPreviewPreference,
  );
  const { isHLSRunning, isRTMPRunning } = useRecordingStreaming();
  const authToken = useAuthToken();
  const [name, setName] = useState(initialName || previewPreference.name);
  const { isLocalAudioEnabled, isLocalVideoEnabled, toggleAudio, toggleVideo } = useAVToggle();
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
  const roomState = useHMSStore(selectRoomState);

  const savePreferenceAndJoin = useCallback(() => {
    setPreviewPreference({
      name,
      isAudioMuted: !isLocalAudioEnabled,
      isVideoMuted: !isLocalVideoEnabled,
    });
    join();
    onJoin && onJoin();
  }, [join, isLocalAudioEnabled, isLocalVideoEnabled, name, setPreviewPreference, onJoin]);
  const roomLayout = useRoomLayout();

  const { preview_header: previewHeader = {} } = roomLayout?.screens?.preview?.live_streaming?.elements || {};

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
    <Container css={{ h: '100%', pt: '$10', '@md': { justifyContent: 'space-between' } }}>
      {toggleVideo ? null : <Box />}
      <Flex direction="column" justify="center" css={{ w: '100%', maxWidth: '360px' }}>
        <Logo />
        <Text variant="h4" css={{ wordBreak: 'break-word', textAlign: 'center', mt: '$10', '@md': { mt: '$8' } }}>
          {previewHeader.title}
        </Text>
        <Text css={{ c: '$on_surface_medium', my: '$4', textAlign: 'center' }} variant="body1">
          {previewHeader.sub_title}
        </Text>
        <Flex justify="center" css={{ my: '$8', gap: '$4' }}>
          {isHLSRunning || isRTMPRunning ? (
            <Chip
              content="LIVE"
              backgroundColor="$alert_error_default"
              icon={<Box css={{ h: '$sm', w: '$sm', backgroundColor: '$on_surface_high', borderRadius: '$round' }} />}
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
    <FullPageProgress />
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
        bg: '$surface_default',
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
        <FullPageProgress />
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
  const isVideoOn = useHMSStore(selectIsLocalVideoEnabled);
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
        <Suspense fallback="">{isVideoOn ? <VirtualBackground /> : null}</Suspense>
      </Flex>
      {!hideSettings ? <PreviewSettings /> : null}
    </Flex>
  );
};

// Bottom action sheet goes here, if isMobile
export const PreviewSettings = React.memo(() => {
  const [open, setOpen] = useState(false);

  return (
    <Fragment>
      <IconButton data-testid="preview_setting_btn" css={{ flexShrink: 0 }} onClick={() => setOpen(value => !value)}>
        <SettingsIcon />
      </IconButton>
      {open && <SettingsModal open={open} onOpenChange={setOpen} />}
    </Fragment>
  );
});

export default PreviewJoin;
